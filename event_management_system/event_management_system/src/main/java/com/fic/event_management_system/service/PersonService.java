package com.fic.event_management_system.service;

import com.fic.event_management_system.entity.Person;
import com.fic.event_management_system.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonService {

    private final PersonRepository personRepository;

    @Autowired
    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    @SuppressWarnings("null")
    public Optional<Person> getPersonById(Long id) {
        return personRepository.findById(id);
    }

    @SuppressWarnings("null")
    public Person createPerson(Person person) {
        return personRepository.save(person);
    }

    @SuppressWarnings("null")
    public Person updatePerson(Long id, Person personDetails) {
        return personRepository.findById(id).map(person -> {
            person.setName(personDetails.getName());
            person.setProfileImageUrl(personDetails.getProfileImageUrl());
            person.setPrimaryRole(personDetails.getPrimaryRole());
            return personRepository.save(person);
        }).orElseThrow(() -> new RuntimeException("Person not found with id " + id));
    }

    @SuppressWarnings("null")
    public void deletePerson(Long id) {
        personRepository.deleteById(id);
    }
}
