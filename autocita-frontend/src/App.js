import { useEffect, useState } from "react";

function App() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/hello`)
      .then(res => res.text())
      .then(data => setMensaje(data))
      .catch(err => setMensaje("Error al conectar con el backend"));
  }, []);

  return (
    <div>
      <h1>AutoCita</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;
