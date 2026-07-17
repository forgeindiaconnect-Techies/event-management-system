package com.fic.event_management_system.serviceImpl;

import com.fic.event_management_system.entity.Ticket;
import com.fic.event_management_system.enums.TicketStatus;
import com.fic.event_management_system.repository.TicketRepository;
import com.fic.event_management_system.service.TicketPdfService;
import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.itextpdf.text.Image;

import java.io.ByteArrayOutputStream;


import java.io.ByteArrayOutputStream;

@Service
public class TicketPdfServiceImpl implements TicketPdfService {

    private final TicketRepository ticketRepository;

    public TicketPdfServiceImpl(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Override
    public byte[] generateTicketPdf(Long ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new RuntimeException("Cancelled ticket cannot be downloaded");
        }

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            Document document = new Document();

            PdfWriter.getInstance(document, out);

            document.open();

            document.add(new Paragraph("EVENT TICKET"));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Event: "
                    + ticket.getRegistration().getEvent().getEventName()));

            document.add(new Paragraph("Participant: "
                    + ticket.getRegistration().getParticipant().getFirstName()));

            document.add(new Paragraph("Ticket Number: "
                    + ticket.getTicketNumber()));

            byte[] qrBytes = generateQrCode(ticket.getQrCode());

            Image qrImage = Image.getInstance(qrBytes);

            qrImage.scaleAbsolute(150, 150);

            document.add(new Paragraph("QR Code"));
            document.add(qrImage);

            document.close();

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF");
        }
    }
    
    private byte[] generateQrCode(String qrText) {

        try {

            BitMatrix bitMatrix = new com.google.zxing.MultiFormatWriter()
                    .encode(qrText, BarcodeFormat.QR_CODE, 200, 200);

            ByteArrayOutputStream pngOutputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    pngOutputStream
            );

            return pngOutputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code");
        }
    }
}
