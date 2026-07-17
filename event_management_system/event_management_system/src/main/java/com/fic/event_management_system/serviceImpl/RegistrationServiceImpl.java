package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.dto.PublicAnswerRequest;
import com.fic.event_management_system.dto.PublicRegistrationRequest;
import com.fic.event_management_system.entity.Event;
import com.fic.event_management_system.entity.PublicParticipant;
import com.fic.event_management_system.entity.Registration;
import com.fic.event_management_system.entity.RegistrationAnswer;
import com.fic.event_management_system.entity.RegistrationFormField;
import com.fic.event_management_system.entity.Ticket;
import com.fic.event_management_system.entity.TicketClass;
import com.fic.event_management_system.enums.EventStatus;
import com.fic.event_management_system.enums.NotificationType;
import com.fic.event_management_system.enums.PaymentStatus;
import com.fic.event_management_system.enums.RegistrationStatus;
import com.fic.event_management_system.enums.RegistrationType;
import com.fic.event_management_system.enums.TicketStatus;
import com.fic.event_management_system.repository.EventRepository;
import com.fic.event_management_system.repository.PublicParticipantRepository;
import com.fic.event_management_system.repository.RegistrationAnswerRepository;
import com.fic.event_management_system.repository.RegistrationFormFieldRepository;
import com.fic.event_management_system.repository.RegistrationRepository;
import com.fic.event_management_system.repository.TicketClassRepository;
import com.fic.event_management_system.repository.TicketRepository;
import com.fic.event_management_system.security.TenantSecurityService;
import com.fic.event_management_system.service.EmailService;
import com.fic.event_management_system.service.RegistrationService;
import com.fic.event_management_system.service.SubscriptionLimitService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationServiceImpl implements RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final PublicParticipantRepository publicParticipantRepository;
    private final TicketRepository ticketRepository;
    private final EmailService emailService;
    private final RegistrationFormFieldRepository fieldRepository;
    private final RegistrationAnswerRepository answerRepository;
    private final TicketClassRepository ticketClassRepository;
    private final TenantSecurityService tenantSecurityService;
    private final SubscriptionLimitService subscriptionLimitService;

    public RegistrationServiceImpl(
            RegistrationRepository registrationRepository,
            EventRepository eventRepository,
            PublicParticipantRepository publicParticipantRepository,
            TicketRepository ticketRepository,
            RegistrationFormFieldRepository fieldRepository,
            RegistrationAnswerRepository answerRepository,
            TicketClassRepository ticketClassRepository,
            EmailService emailService,
            TenantSecurityService tenantSecurityService,
            SubscriptionLimitService subscriptionLimitService) {

        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.publicParticipantRepository = publicParticipantRepository;
        this.ticketRepository = ticketRepository;
        this.fieldRepository = fieldRepository;
        this.answerRepository = answerRepository;
        this.ticketClassRepository = ticketClassRepository;
        this.emailService = emailService;
        this.tenantSecurityService = tenantSecurityService;
        this.subscriptionLimitService = subscriptionLimitService;
    }

    @Override
    public Registration registerForEvent(
            Long eventId,
            Long participantId,
            String registrationType) {

        tenantSecurityService.requireEventInLoggedInPortal(eventId);

        return registerForEventInternal(
                eventId,
                participantId,
                registrationType,
                null,
                1,
                "PER_TICKET"
        );
    }

    private Registration registerForEventInternal(
            Long eventId,
            Long participantId,
            String registrationType,
            TicketClass ticketClass,
            Integer ticketQuantity,
            String qrGenerationMode) {

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        subscriptionLimitService.assertCanRegister(eventId);

        PublicParticipant participant =
                publicParticipantRepository.findById(participantId)
                        .orElseThrow(() ->
                                new RuntimeException("Participant not found"));

        RegistrationType type =
                RegistrationType.valueOf(registrationType.toUpperCase());

        int quantity = normalizeQuantity(ticketQuantity);
        String qrMode = normalizeQrMode(qrGenerationMode, type);
        int seatUse = type == RegistrationType.AUDIENCE ? quantity : 1;

        if (registrationRepository.existsByEventIdAndParticipant_IdAndRegistrationType(
                eventId,
                participantId,
                type)) {

            throw new RuntimeException("Already registered for this event as " + type);
        }

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new RuntimeException("Registration allowed only for published events");
        }

        if (event.getRegistrationDeadline() != null &&
                event.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Registration deadline is over");
        }

        if (event.getAvailableSeats() == null ||
                event.getAvailableSeats() < seatUse) {

            Registration waitlistRegistration = new Registration();

            waitlistRegistration.setEvent(event);
            waitlistRegistration.setParticipant(participant);
            waitlistRegistration.setRegistrationType(type);
            waitlistRegistration.setStatus(RegistrationStatus.WAITLISTED);
            waitlistRegistration.setAttended(false);
            waitlistRegistration.setTicketClass(ticketClass);
            waitlistRegistration.setTicketQuantity(quantity);
            waitlistRegistration.setQrGenerationMode(qrMode);
            waitlistRegistration.setTotalAmount(calculateTotalAmount(ticketClass, quantity, event));

            if (event.getPaid()) {
                waitlistRegistration.setPaymentStatus(PaymentStatus.NOT_STARTED);
            } else {
                waitlistRegistration.setPaymentStatus(PaymentStatus.FREE);
            }

            registrationRepository.save(waitlistRegistration);

            queueParticipantEmail(
                    waitlistRegistration,
                    NotificationType.REGISTRATION_WAITLISTED,
                    "Added to Waitlist",
                    "You have been added to the waitlist for "
                            + event.getEventName(),
                    "REGISTRATION_WAITLISTED_" + waitlistRegistration.getId()
            );

            return waitlistRegistration;
        }

        Registration registration = new Registration();

        registration.setEvent(event);
        registration.setParticipant(participant);
        registration.setRegistrationType(type);
        registration.setStatus(RegistrationStatus.REGISTERED);
        registration.setAttended(false);
        registration.setTicketClass(ticketClass);
        registration.setTicketQuantity(quantity);
        registration.setQrGenerationMode(qrMode);
        registration.setTotalAmount(calculateTotalAmount(ticketClass, quantity, event));

        if (event.getPaid() != null && event.getPaid()) {
            registration.setPaymentStatus(PaymentStatus.NOT_STARTED);
        } else {
            registration.setPaymentStatus(PaymentStatus.FREE);
        }

        Registration savedRegistration = registrationRepository.save(registration);

        queueParticipantEmail(
                savedRegistration,
                NotificationType.REGISTRATION_SUCCESS,
                "Event Registration Successful",
                "Hello " + participant.getFirstName() + ",\n\n" +
                        "You have successfully registered for " + event.getEventName() + ".\n" +
                        "Registration Type: " + type + "\n" +
                        "Payment Status: " + savedRegistration.getPaymentStatus() + "\n\n" +
                        "Thank you.",
                "REGISTRATION_SUCCESS_" + savedRegistration.getId()
        );

        event.setAvailableSeats(event.getAvailableSeats() - seatUse);
        eventRepository.save(event);

        if (savedRegistration.getPaymentStatus() == PaymentStatus.FREE) {
            List<Ticket> tickets = generateTickets(savedRegistration);

            queueParticipantEmail(
                    savedRegistration,
                    NotificationType.TICKET_GENERATED,
                    "Ticket Generated",
                    "Your ticket has been generated for " + event.getEventName() + ".\n" +
                            "Ticket Count: " + tickets.size(),
                    "TICKET_GENERATED_" + savedRegistration.getId()
            );
        }

        return savedRegistration;
    }

    @Override
    public List<Registration> getAllRegistrations() {
        return registrationRepository.findByEvent_Portal_Id(
                tenantSecurityService.getLoggedInPortalId()
        );
    }

    @Override
    public Registration getRegistrationById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
    }

    @Override
    public List<Registration> getRegistrationsByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);
        return registrationRepository.findByEventId(eventId);
    }

    @Override
    public String cancelRegistration(Long registrationId) {
        Registration registration = getRegistrationById(registrationId);
        requireRegistrationInLoggedInPortal(registration);

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            return "Registration already cancelled";
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registrationRepository.save(registration);

        Event event = registration.getEvent();

        List<Registration> waitlist =
                registrationRepository.findByEventIdAndStatusOrderByIdAsc(
                        event.getId(),
                        RegistrationStatus.WAITLISTED
                );

        if (!waitlist.isEmpty()) {
            Registration promoted = waitlist.get(0);

            promoted.setStatus(RegistrationStatus.REGISTERED);
            registrationRepository.save(promoted);

            queueParticipantEmail(
                    promoted,
                    NotificationType.WAITLIST_CONFIRMED,
                    "Waitlist Confirmed",
                    "Good news! Your registration for "
                            + event.getEventName()
                            + " is now confirmed.",
                    "WAITLIST_CONFIRMED_" + promoted.getId()
            );

            return "Registration cancelled. Waitlisted user promoted.";
        }

        if (event.getAvailableSeats() != null) {
            event.setAvailableSeats(event.getAvailableSeats() + 1);
            eventRepository.save(event);
        }

        return "Registration cancelled successfully";
    }

    @Override
    public List<Registration> getRegistrationsByEventAndType(
            Long eventId,
            String type) {

        tenantSecurityService.requireEventInLoggedInPortal(eventId);

        return registrationRepository.findByEventIdAndRegistrationType(
                eventId,
                RegistrationType.valueOf(type.toUpperCase())
        );
    }

    @Override
    public Registration startPayment(Long registrationId, String paymentMethod) {
        Registration registration = getRegistrationById(registrationId);

        if (registration.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Payment already completed");
        }

        if (registration.getPaymentStatus() == PaymentStatus.FREE) {
            throw new RuntimeException("This registration does not require payment");
        }

        registration.setPaymentStatus(PaymentStatus.PENDING);
        registration.setPaymentMethod(paymentMethod);
        registration.setTransactionReference(null);
        registration.setPaymentDate(null);
        return registrationRepository.save(registration);
    }

    @Override
    public Registration markAsPaid(Long registrationId, String paymentMethod) {
        Registration registration = getRegistrationById(registrationId);

        if (registration.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Payment already completed");
        }

        if (registration.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Payment has not been started");
        }

        registration.setPaymentStatus(PaymentStatus.PAID);

        registration.setPaymentMethod(paymentMethod);

        registration.setTransactionReference(
                "TXN-" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase()
        );

        registration.setPaymentDate(LocalDateTime.now());

        Registration savedRegistration = registrationRepository.save(registration);

        if (!ticketRepository.existsByRegistrationId(registrationId)) {
            List<Ticket> tickets = generateTickets(savedRegistration);

            queueParticipantEmail(
                    savedRegistration,
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful & Ticket Generated",
                    "Hello " +
                    savedRegistration.getParticipant().getFirstName() +
                    ",\n\n" +
                    "Payment Successful.\n\n" +
                    "Transaction Ref : " +
                    savedRegistration.getTransactionReference() +
                    "\nPayment Method : " +
                    savedRegistration.getPaymentMethod() +
                    "\nTicket Count : " +
                    tickets.size(),
                    "PAYMENT_SUCCESS_" + savedRegistration.getId()
            );
        }

        return savedRegistration;
    }

    @Override
    public Registration markAsPaymentFailed(Long registrationId) {
        Registration registration = getRegistrationById(registrationId);
        if (registration.getPaymentStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Cannot fail payment after it is paid");
        }

        registration.setPaymentStatus(PaymentStatus.FAILED);

        Registration savedRegistration = registrationRepository.save(registration);

        queueParticipantEmail(
                savedRegistration,
                NotificationType.PAYMENT_FAILED,
                "Payment Failed",
                "Your payment for " +
                        savedRegistration.getEvent().getEventName() +
                        " has failed. Please try again.",
                "PAYMENT_FAILED_" + savedRegistration.getId()
        );

        return savedRegistration;
    }

    @Override
    @Transactional
    public Registration updatePaymentStatusManually(Long registrationId, String status) {
        tenantSecurityService.requirePortalAdminOrOrganizer();

        Registration registration = getRegistrationById(registrationId);
        requireRegistrationInLoggedInPortal(registration);

        PaymentStatus nextStatus;
        try {
            nextStatus = PaymentStatus.valueOf(String.valueOf(status).trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Invalid payment status");
        }

        if (nextStatus == PaymentStatus.FREE && Boolean.TRUE.equals(registration.getEvent().getPaid())) {
            throw new RuntimeException("A paid event registration cannot be marked free");
        }

        registration.setPaymentStatus(nextStatus);

        List<Ticket> existingTickets = ticketRepository.findByRegistrationIdOrderByIdAsc(registrationId);
        if (nextStatus == PaymentStatus.PAID) {
            registration.setPaymentMethod(
                    registration.getPaymentMethod() == null || registration.getPaymentMethod().isBlank()
                            ? "Manual update"
                            : registration.getPaymentMethod()
            );
            registration.setPaymentDate(LocalDateTime.now());
            if (registration.getTransactionReference() == null || registration.getTransactionReference().isBlank()) {
                registration.setTransactionReference(
                        "MANUAL-" + UUID.randomUUID().toString().replace("-", "")
                                .substring(0, 12).toUpperCase()
                );
            }

            if (existingTickets.isEmpty()) {
                generateTickets(registration);
            } else {
                existingTickets.forEach(ticket -> ticket.setStatus(TicketStatus.ACTIVE));
                ticketRepository.saveAll(existingTickets);
            }
        } else {
            existingTickets.forEach(ticket -> ticket.setStatus(TicketStatus.CANCELLED));
            ticketRepository.saveAll(existingTickets);
            registration.setPaymentDate(null);
            registration.setTransactionReference(null);
            if (nextStatus == PaymentStatus.NOT_STARTED) {
                registration.setPaymentMethod(null);
            }
        }

        return registrationRepository.save(registration);
    }

    @Override
    public List<Registration> getWaitlistByEvent(Long eventId) {
        tenantSecurityService.requireEventInLoggedInPortal(eventId);

        return registrationRepository.findByEventIdAndStatusOrderByIdAsc(
                eventId,
                RegistrationStatus.WAITLISTED
        );
    }

    @Override
    public List<Registration> getRegistrationsByPortal(Long portalId) {
        tenantSecurityService.requireSamePortal(portalId);
        return registrationRepository.findByEvent_Portal_Id(portalId);
    }

    @Override
    public Registration markAttendance(Long registrationId) {
        Registration registration = getRegistrationById(registrationId);
        requireRegistrationInLoggedInPortal(registration);

        if (registration.getStatus() != RegistrationStatus.REGISTERED) {
            throw new RuntimeException("Only registered users can be marked present");
        }

        registration.setAttended(true);
        return registrationRepository.save(registration);
    }

    @Override
    public Registration publicRegister(
            Long eventId,
            PublicRegistrationRequest request) {

        PublicParticipant participant =
                publicParticipantRepository.findByEmail(request.getEmail())
                        .orElse(null);

        if (participant == null) {
            participant = new PublicParticipant();

            participant.setFirstName(request.getFirstName());
            participant.setLastName(request.getLastName());
            participant.setEmail(request.getEmail());
            participant.setPhoneNumber(request.getPhoneNumber());

            participant = publicParticipantRepository.save(participant);
        }

        TicketClass ticketClass = null;
        if (request.getTicketClassId() != null) {
            ticketClass = ticketClassRepository.findById(request.getTicketClassId())
                    .orElseThrow(() -> new RuntimeException("Ticket class not found"));

            if (!ticketClass.getEvent().getId().equals(eventId)) {
                throw new RuntimeException("Ticket class does not belong to this event");
            }
        }

        Registration registration =
                registerForEventInternal(
                        eventId,
                        participant.getId(),
                        request.getRegistrationType(),
                        ticketClass,
                        request.getTicketQuantity(),
                        request.getQrGenerationMode()
                );

        if (request.getAnswers() != null) {
            for (PublicAnswerRequest answerDto : request.getAnswers()) {
                RegistrationFormField field =
                        fieldRepository.findById(answerDto.getFieldId())
                                .orElseThrow(() ->
                                        new RuntimeException("Field not found"));

                if (field.getEvent() == null || !field.getEvent().getId().equals(eventId)) {
                    throw new RuntimeException("Form field does not belong to this event");
                }

                RegistrationAnswer answer = new RegistrationAnswer();

                answer.setRegistration(registration);
                answer.setFormField(field);
                answer.setAnswer(answerDto.getAnswer());

                answerRepository.save(answer);
            }
        }

        return registration;
    }

    private void queueParticipantEmail(
            Registration registration,
            NotificationType notificationType,
            String subject,
            String body,
            String deduplicationKey) {

        emailService.queueEmail(
                registration.getParticipant().getEmail(),
                subject,
                body,
                notificationType,
                null,
                registration.getEvent().getPortal(),
                registration.getEvent(),
                deduplicationKey,
                LocalDateTime.now()
        );
    }

    private void requireRegistrationInLoggedInPortal(Registration registration) {
        if (registration == null || registration.getEvent() == null) {
            throw new RuntimeException("Registration is not linked to an event");
        }

        tenantSecurityService.requireEventInLoggedInPortal(registration.getEvent());
    }

    private List<Ticket> generateTickets(Registration registration) {
        int quantity = normalizeQuantity(registration.getTicketQuantity());
        String qrMode = normalizeQrMode(
                registration.getQrGenerationMode(),
                registration.getRegistrationType()
        );

        if ("PER_ORDER".equals(qrMode)) {
            Ticket ticket = createTicket(registration, quantity, qrMode, "ORDER");
            incrementTicketClassSold(registration.getTicketClass(), quantity);
            return List.of(ticketRepository.save(ticket));
        }

        List<Ticket> tickets = new java.util.ArrayList<>();
        for (int index = 1; index <= quantity; index++) {
            tickets.add(ticketRepository.save(createTicket(registration, 1, qrMode, String.valueOf(index))));
        }
        incrementTicketClassSold(registration.getTicketClass(), quantity);
        return tickets;
    }

    private Ticket createTicket(Registration registration, int quantity, String qrMode, String suffix) {
        String ticketNumber = "TICKET-" + UUID.randomUUID();

        Ticket ticket = new Ticket();
        ticket.setTicketNumber(ticketNumber);
        ticket.setQrCode("QR-" + registration.getId() + "-" + suffix + "-" + ticketNumber);
        ticket.setStatus(TicketStatus.ACTIVE);
        ticket.setRegistration(registration);
        ticket.setTicketClass(registration.getTicketClass());
        ticket.setQuantity(quantity);
        ticket.setCheckedInQuantity(0);
        ticket.setQrMode(qrMode);

        return ticket;
    }

    private void incrementTicketClassSold(TicketClass ticketClass, int quantity) {
        if (ticketClass == null) {
            return;
        }

        ticketClass.setSold((ticketClass.getSold() == null ? 0 : ticketClass.getSold()) + quantity);
        ticketClassRepository.save(ticketClass);
    }

    private int normalizeQuantity(Integer quantity) {
        return quantity == null || quantity < 1 ? 1 : quantity;
    }

    private String normalizeQrMode(String qrGenerationMode, RegistrationType type) {
        if (type != RegistrationType.AUDIENCE) {
            return "PER_PARTICIPANT";
        }

        if ("PER_ORDER".equalsIgnoreCase(qrGenerationMode)) {
            return "PER_ORDER";
        }

        return "PER_TICKET";
    }

    private BigDecimal calculateTotalAmount(TicketClass ticketClass, int quantity, Event event) {
        if (ticketClass != null && ticketClass.getPrice() != null) {
            return ticketClass.getPrice().multiply(BigDecimal.valueOf(quantity));
        }

        if (event.getTicketPrice() != null) {
            return BigDecimal.valueOf(event.getTicketPrice()).multiply(BigDecimal.valueOf(quantity));
        }

        return BigDecimal.ZERO;
    }
}
