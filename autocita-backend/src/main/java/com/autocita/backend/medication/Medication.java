package com.autocita.backend.medication;

import com.autocita.backend.model.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "medications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Medication extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String activeIngredient;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String dosage;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String imageUrl;
}
