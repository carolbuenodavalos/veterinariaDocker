package app.controller;

import app.entity.Tutor;
import app.service.TutorService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tutor")
//@CrossOrigin("*")
public class TutorController {

    private final TutorService service;

    public TutorController(TutorService service) {
        this.service = service;
    }

    // Visualização liberada para todos os perfis autenticados
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1') or hasRole('USER_SISTEMA2') or hasRole('USER_BASICO')")
    @GetMapping
    public ResponseEntity<List<Tutor>> findAll() {
        return ResponseEntity.ok(service.findAll());
        
    }

    // Visualização liberada para todos os perfis autenticados
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1') or hasRole('USER_SISTEMA2') or hasRole('USER_BASICO')")
    @GetMapping("/{id}")
    public ResponseEntity<Tutor> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // Visualização liberada para todos os perfis autenticados
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1') or hasRole('USER_SISTEMA2') or hasRole('USER_BASICO')")
    // opcional: busca por nome
    @GetMapping("/search")
    public ResponseEntity<List<Tutor>> findByNome(@RequestParam String nome) {
        return ResponseEntity.ok(service.findByNome(nome));
    }

    // Edição liberada para ADMIN e USER_SISTEMA1
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> create(@RequestBody Tutor tutor) {
        Tutor salvo = service.save(tutor);
        URI location = URI.create("/api/tutor/" + salvo.getId());
        return ResponseEntity.created(location).body("Tutor salvo com sucesso");
    }

    // Edição liberada para ADMIN e USER_SISTEMA1
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1')")
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> update(@PathVariable Long id, @RequestBody Tutor tutor) {
        service.update(id, tutor);
        return ResponseEntity.ok("Tutor atualizado com sucesso");
    }

    // Exclusão liberada para ADMIN e USER_SISTEMA1
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER_SISTEMA1')")
    @DeleteMapping(value = "/{id}", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok("Tutor excluído com sucesso");
    }
}
