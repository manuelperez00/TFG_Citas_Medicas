import React from 'react';

function DoctorProfile({ doctorData, onSave }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState(null);

    const [form, setForm] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        workShift: ''
    });

    React.useEffect(() => {
        if (doctorData) {
            setForm({
                firstName: doctorData.firstName || doctorData.first_name || doctorData.user?.firstName || doctorData.user?.first_name || '',
                lastName: doctorData.lastName || doctorData.last_name || doctorData.user?.lastName || doctorData.user?.last_name || '',
                email: doctorData.email || doctorData.user?.email || '',
                phone: doctorData.phone || doctorData.user?.phone || '',
                workShift: doctorData.workShift || doctorData.work_shift || ''
            });
        }
    }, [doctorData]);

    if (!doctorData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Cargando perfil profesional...
            </div>
        );
    }

    const first = doctorData.firstName || doctorData.first_name || doctorData.user?.firstName || doctorData.user?.first_name || '';
    const last = doctorData.lastName || doctorData.last_name || doctorData.user?.lastName || doctorData.user?.last_name || '';
    const specialty = doctorData.specialty || 'No especificado';
    const licenseNumber = doctorData.licenseNumber || doctorData.license_number || doctorData.user?.licenseNumber || 'No disponible';
    const workShift = doctorData.workShift || doctorData.work_shift || 'No establecido';
    const email = doctorData.email || doctorData.user?.email || 'No disponible';
    const phone = doctorData.phone || doctorData.user?.phone || 'No disponible';
    const active = doctorData.active === true || doctorData.active === 'true';

    const formatDate = (value) => {
        if (!value) return 'No disponible';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const createdAt = formatDate(doctorData.createdAt || doctorData.created_at);
    const updatedAt = formatDate(doctorData.updatedAt || doctorData.updated_at);

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

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        const success = await onSave({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            workShift: form.workShift
        });
        setSaving(false);
        if (success) {
            setIsEditing(false);
        } else {
            setSaveError('No se pudo guardar el perfil. Comprueba los datos.');
        }
    };

    return (
        <section style={{ backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 14px rgba(15, 23, 42, 0.08)', maxWidth: '1080px', margin: '0 auto' }}>
            <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>👨‍⚕️ Perfil Profesional</h2>
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
                            <button onClick={() => setIsEditing(false)} disabled={saving} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>
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

                    <label style={labelStyle}>Turno</label>
                    {isEditing ? (
                        <select value={form.workShift} onChange={handleChange('workShift')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                            <option value="MORNING">Mañana</option>
                            <option value="AFTERNOON">Tarde</option>
                            <option value="ANY">Ambos</option>
                        </select>
                    ) : (
                        <div style={displayStyle}>{workShift === 'MORNING' ? 'Mañana' : workShift === 'AFTERNOON' ? 'Tarde' : workShift === 'ANY' ? 'Ambos' : workShift}</div>
                    )}

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Especialidad</label>
                    <div style={nonEditableValueStyle}>{specialty}</div>

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Colegiado</label>
                    <div style={nonEditableValueStyle}>{licenseNumber}</div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    <label style={labelStyle}>Email</label>
                    {isEditing ? (
                        <input value={form.email} onChange={handleChange('email')} style={inputStyle} />
                    ) : (
                        <div style={displayStyle}>{email}</div>
                    )}

                    <label style={labelStyle}>Teléfono</label>
                    {isEditing ? (
                        <input value={form.phone} onChange={handleChange('phone')} style={inputStyle} />
                    ) : (
                        <div style={displayStyle}>{phone}</div>
                    )}

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Creado</label>
                    <div style={nonEditableValueStyle}>{createdAt}</div>

                    <label style={nonEditableLabelStyle} title="Campo no editable" aria-label="No editable">Actualizado</label>
                    <div style={nonEditableValueStyle}>{updatedAt}</div>
                </div>
            </div>

            {saveError && <p style={{ color: '#b91c1c', margin: '12px 0' }}>{saveError}</p>}

            <p style={{ color: '#475569', margin: 0, fontSize: '0.86rem' }}>Este perfil muestra los datos almacenados para el médico. Los campos de especialidad y colegiado no se pueden editar. Contacta con soporte si hay datos incorrectos.</p>
        </section>
    );
}

export default DoctorProfile;
