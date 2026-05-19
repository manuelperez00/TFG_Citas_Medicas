export const SPECIALTY_ES = {
  PEDIATRICS: 'Pediatría',
  DERMATOLOGY: 'Dermatología',
  CARDIOLOGY: 'Cardiología',
  GYNECOLOGY: 'Ginecología',
  DIGESTIVE: 'Digestivo',
  FAMILY_MEDICINE: 'Medicina de Familia',
  TRAUMATOLOGY: 'Traumatología',
  OPHTHALMOLOGY: 'Oftalmología',
  ENDOCRINOLOGY: 'Endocrinología',
  ENT: 'Otorrinolaringología',
  NEUROLOGY: 'Neurología',
  PSYCHIATRY: 'Psiquiatría',
  PSYCHOLOGY: 'Psicología',
  GENERAL_SURGERY: 'Cirugía General',
  RADIOLOGY: 'Radiología',
  UROLOGY: 'Urología',
  ALLERGY: 'Alergología'
};

export const translateSpecialty = (specialty) =>
  SPECIALTY_ES[specialty] || specialty;
