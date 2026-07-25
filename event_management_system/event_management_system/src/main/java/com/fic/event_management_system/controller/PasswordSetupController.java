package com.fic.event_management_system.controller;
import com.fic.event_management_system.dto.PasswordSetupRequest;
import com.fic.event_management_system.service.AccountActivationService;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth/password-setup") @CrossOrigin(origins="*")
public class PasswordSetupController {
    private final AccountActivationService service;
    public PasswordSetupController(AccountActivationService service){this.service=service;}
    @PostMapping("/details") public ResponseEntity<?> details(@RequestBody Map<String,String> body){ return respond(() -> service.getPasswordSetupDetails(body.get("token"))); }
    @PostMapping("/complete") public ResponseEntity<?> complete(@RequestBody PasswordSetupRequest request){ return respond(() -> { service.completePasswordSetup(request.getToken(),request.getPassword(),request.getConfirmPassword()); return Map.of("message","Password set successfully. You can now sign in."); }); }
    @PostMapping("/resend") public ResponseEntity<?> resend(@RequestBody Map<String,String> body){ return respond(() -> { service.resendPasswordSetupLink(body.get("token")); return Map.of("message","A new set-password link has been sent to your registered email."); }); }
    private ResponseEntity<?> respond(ThrowingSupplier action){ try{return ResponseEntity.ok(action.get());}catch(IllegalArgumentException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}catch(Exception e){return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message","Unable to process password setup."));}}
    @FunctionalInterface private interface ThrowingSupplier { Object get(); }
}
