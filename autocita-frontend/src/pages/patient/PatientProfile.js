import React from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9}$/;
const NAME_RE = /\d/;

function PatientProfile({ patientData, onSave }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState(null);
    const [localUpdatedAt, setLocalUpdatedAt] = React.useState(null);

    const [form, setForm] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        gender: ''
    });

    React.useEffect(() => {
        if (patientData) {
            setForm({
                firstName: patientData.firstName || patientData.first_name || '',
                lastName: patientData.lastName || patientData.last_name || '',
                email: patientData.email || patientData.user?.email || '',
                phone: patientData.phone || patientData.user?.phone || '',
                address: patientData.address || '',
                gender: patientData.gender || 'OTHER'
            });
        }
    }, [patientData]);

    if (!patientData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Cargando perfil de paciente...
            </div>
        );
    }

    const first = patientData.firstName || patientData.first_name || patientData.user?.firstName || patientData.user?.first_name || '';
    const last = patientData.lastName || patientData.last_name || patientData.user?.lastName || patientData.user?.last_name || '';
    const documentId = patientData.documentId || patientData.document_id || 'No disponible';
    const gender = patientData.gender || 'No especificado';
    const birthDate = patientData.birthDate || patientData.birth_date || 'No disponible';
    const address = patientData.address || 'No disponible';
    const email = patientData.email || patientData.user?.email || 'No disponible';
    const phone = patientData.phone || patientData.user?.phone || 'No disponible';
    const active = patientData.active === true || patientData.active === 'true';

    const formatDate = (value) => {
        if (!value) return 'No disponible';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const createdAt = formatDate(patientData.createdAt || patientData.created_at);
    const updatedAt = localUpdatedAt || formatDate(patientData.updatedAt || patientData.updated_at);

    const inputStyle = {
        width: '100%',
        padding: '12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
    };

    const displayStyle = {
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
    };

    const labelStyle = {
        color: '#64748b',
        fontSize: '0.8rem',
        fontWeight: 700,
        marginBottom: '4px'
    };

    const nonEditableLabelStyle = {
        ...labelStyle,
        color: '#0f172a',
        fontWeight: 800,
        cursor: 'not-allowed'
    };

    const nonEditableValueStyle = {
        ...displayStyle,
        cursor: 'not-allowed',
        backgroundColor: '#e5e9f2',
        color: '#0f172a',
        border: '1px solid #c7d3e2',
        fontWeight: 700,
        minHeight: '4px'
    };

    const handleChange = (field) => (event) => {
        setForm({ ...form, [field]: event.target.value });
    };

    const validate = () => {
        if (!form.firstName.trim() || NAME_RE.test(form.firstName)) {
            return 'El nombre no puede estar vacío ni contener números.';
        }
        if (!form.lastName.trim() || NAME_RE.test(form.lastName)) {
            return 'El apellido no puede estar vacío ni contener números.';
        }
        if (!EMAIL_RE.test(form.email)) {
            return 'El email no tiene un formato válido (ej: usuario@dominio.com).';
        }
        if (!PHONE_RE.test(form.phone)) {
            return 'El teléfono debe tener exactamente 9 dígitos numéricos.';
        }
        return null;
    };

    const handleSave = async () => {
        const validationError = validate();
        if (validationError) {
            setSaveError(validationError);
            return;
        }
        setSaving(true);
        setSaveError(null);
        let success = false;
        try {
            success = await onSave({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                address: form.address,
                gender: form.gender
            });
        } catch {
            success = false;
        }
        setSaving(false);
        if (success) {
            setIsEditing(false);
            setLocalUpdatedAt(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        } else {
            setSaveError('No se pudo guardar el perfil. Comprueba los datos.');
        }
    };

    return (
        <section style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 14px rgba(15, 23, 42, 0.08)', maxWidth: '1080px', margin: '0 auto' }}>
            <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>🧑‍⚕️ Perfil de Paciente</h2>
                    <p style={{ margin: 0, color: '#475569' }}>Información sincronizada con la base de datos</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '7px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: active ? '#065f46' : '#991b1b', backgroundColor: active ? '#d1fae5' : '#fee2e2' }}>
                        {active ? 'Activo' : 'Inactivo'}
                    </span>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} disabled={saving} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={() => { setIsEditing(false); setSaveError(null); }} disabled={saving} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>
                            Editar
                        </button>
                    )}
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>Nombre</label>
                    {isEditing ? (
                        <input value={form.firstName} onChange={handleChange('firstName')} style={inputStyle} />
                    ) : (
                        <div style={displayStyle}>{first}</div>
                    )}

                    <label style={labelStyle}>Apellido</label>
                    {isEditing ? (
                        <input value={form.lastName} onChange={handleChange('lastName')} style={inputStyle} />
                    ) : (
                        <div style={displayStyle}>{last}</div>
                    )}

                    <label style={labelStyle}>Género</label>
                    {isEditing ? (
                        <select value={form.gender} onChange={handleChange('gender')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                            <option value="MALE">Masculino</option>
                            <option value="FEMALE">Femenino</option>
                            <option value="OTHER">Otro</option>
                            <option value="UNDISCLOSED">Prefiero no decir</option>
                        </select>
                    ) : (
                        <div style={displayStyle}>{gender}</div>
                    )}

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">DNI</label>
                    <div style={nonEditableValueStyle}>{documentId}</div>

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Fecha de nacimiento</label>
                    <div style={nonEditableValueStyle}>{birthDate}</div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>Email</label>
                    {isEditing ? (
                        <input value={form.email} onChange={handleChange('email')} style={inputStyle} type="email" />
                    ) : (
                        <div style={displayStyle}>{email}</div>
                    )}

                    <label style={labelStyle}>Teléfono</label>
                    {isEditing ? (
                        <input value={form.phone} onChange={handleChange('phone')} style={inputStyle} maxLength={9} />
                    ) : (
                        <div style={displayStyle}>{phone}</div>
                    )}

                    <label style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>Dirección</label>
                    {isEditing ? (
                        <input value={form.address} onChange={handleChange('address')} style={inputStyle} />
                    ) : (
                        <div style={displayStyle}>{address}</div>
                    )}

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Creado</label>
                    <div style={nonEditableValueStyle}>{createdAt}</div>

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Actualizado</label>
                    <div style={nonEditableValueStyle}>{updatedAt}</div>
                </div>
            </div>

            {saveError && <p style={{ color: '#b91c1c', margin: '12px 0' }}>{saveError}</p>}

            <p style={{ color: '#475569', margin: 0, fontSize: '0.86rem' }}>Los campos con fondo gris no son editables. Si alguno de ellos contiene información incorrecta, contacta con el servicio técnico para que lo corrijan.</p>
        </section>
    );
}

export default PatientProfile;
