import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAmCCOvKP6oGt_KtBuoU0uBwDFPGH7UqYA",
  authDomain: "formulario-8cfe0.firebaseapp.com",
  projectId: "formulario-8cfe0",
  storageBucket: "formulario-8cfe0.firebasestorage.app",
  messagingSenderId: "993238885271",
  appId: "1:993238885271:web:ec512a32acc8b7b4b21ad2",
  measurementId: "G-31PVBC6XWC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const coleccion = "registros"; // Nombre de la colección en Firestore

// 2. VARIABLES GLOBALES Y ELEMENTOS DEL DOM
let totalRegistros = 0;
const inputs = document.querySelectorAll('.form-group input');
const btnGuardar = document.getElementById('btnGuardar');
const btnEditar = document.getElementById('btnEditar');
const btnEliminar = document.getElementById('btnEliminar');
const switchActivar = document.getElementById('activar');
const docIdInput = document.getElementById('docId');

// 3. FUNCIONES BÁSICAS DE LA UI
window.cerrarModal = (id) => {
    document.getElementById(id).classList.remove('active');
};

// Login simple
document.getElementById('btnLogin').addEventListener('click', () => {
    const user = document.getElementById('loginUser').value;
    if(user.trim() !== "") {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        document.getElementById('userNameDisplay').innerText = user;
    } else {
        document.getElementById('loginError').innerText = "Por favor ingresa un usuario";
    }
});

// Cerrar sesión
document.getElementById('menuLogout').addEventListener('click', () => {
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
});

// Activar/Desactivar formulario
switchActivar.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    inputs.forEach(input => {
        if(input.id !== 'docId') input.disabled = !isChecked;
    });
    document.getElementById('btnGuardar').disabled = !isChecked;
    document.getElementById('btnBuscar').disabled = !isChecked;
    document.getElementById('btnVerExcel').disabled = !isChecked;
    document.getElementById('btnImprimir').disabled = !isChecked;
    document.getElementById('btnConsultar').disabled = !isChecked;
    document.getElementById('btnSalir').disabled = !isChecked;
});

// Salir / Limpiar formulario
document.getElementById('btnSalir').addEventListener('click', () => {
    document.getElementById('miFormulario').reset();
    docIdInput.value = "";
    btnGuardar.disabled = false;
    btnEditar.disabled = true;
    btnEliminar.disabled = true;
    switchActivar.checked = false;
    switchActivar.dispatchEvent(new Event('change'));
});

// 4. LÓGICA DE FIREBASE (Guardar, Buscar, Editar, Eliminar, Leer)

// GUARDAR NUEVO
btnGuardar.addEventListener('click', async () => {
    const cedula = document.getElementById('cedula').value;
    if(!cedula) return alert("La cédula es obligatoria");

    const nuevoRegistro = {
        cedula: cedula,
        telefono: document.getElementById('telefono').value,
        nombre1: document.getElementById('nombre1').value,
        nombre2: document.getElementById('nombre2').value,
        apellido1: document.getElementById('apellido1').value,
        apellido2: document.getElementById('apellido2').value,
        direccion: document.getElementById('direccion').value,
        fecha: new Date().toLocaleString()
    };

    try {
        const docRef = await addDoc(collection(db, coleccion), nuevoRegistro);
        alert("✅ Registro guardado en la nube con ID: " + docRef.id);
        document.getElementById('btnSalir').click(); // Limpiar formulario
        actualizarContador();
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("❌ Error al guardar. Revisa tu conexión o las Reglas de Firebase.");
    }
});

// BUSCAR
document.getElementById('btnBuscar').addEventListener('click', () => {
    document.getElementById('modalBuscar').classList.add('active');
});

window.ejecutarBusqueda = async () => {
    const cedulaBuscada = document.getElementById('inputBuscarCedula').value;
    if(!cedulaBuscada) return;

    const q = query(collection(db, coleccion), where("cedula", "==", cedulaBuscada));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            alert("No se encontró ningún registro con esa cédula.");
            return;
        }

        // Tomamos el primer resultado
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        
        // Llenar formulario
        document.getElementById('cedula').value = data.cedula;
        document.getElementById('telefono').value = data.telefono || "";
        document.getElementById('nombre1').value = data.nombre1 || "";
        document.getElementById('nombre2').value = data.nombre2 || "";
        document.getElementById('apellido1').value = data.apellido1 || "";
        document.getElementById('apellido2').value = data.apellido2 || "";
        document.getElementById('direccion').value = data.direccion || "";
        
        // Guardar el ID del documento en el input oculto
        docIdInput.value = docSnap.id;

        // Activar botones de Editar y Eliminar, desactivar Guardar
        btnGuardar.disabled = true;
        btnEditar.disabled = false;
        btnEliminar.disabled = false;

        cerrarModal('modalBuscar');
    } catch (e) {
        console.error("Error al buscar: ", e);
        alert("Error al buscar en la base de datos.");
    }
};

// EDITAR (Actualizar)
btnEditar.addEventListener('click', async () => {
    const id = docIdInput.value;
    if(!id) return alert("Primero busca un registro para editarlo.");

    const registroActualizado = {
        cedula: document.getElementById('cedula').value,
        telefono: document.getElementById('telefono').value,
        nombre1: document.getElementById('nombre1').value,
        nombre2: document.getElementById('nombre2').value,
        apellido1: document.getElementById('apellido1').value,
        apellido2: document.getElementById('apellido2').value,
        direccion: document.getElementById('direccion').value,
        fechaModificacion: new Date().toLocaleString()
    };

    try {
        const docRef = doc(db, coleccion, id);
        await updateDoc(docRef, registroActualizado);
        alert("✅ Registro actualizado correctamente.");
        document.getElementById('btnSalir').click();
    } catch (e) {
        console.error("Error al actualizar: ", e);
        alert("Error al actualizar el registro.");
    }
});

// ELIMINAR
btnEliminar.addEventListener('click', () => {
    if(!docIdInput.value) return alert("Primero busca un registro para eliminarlo.");
    document.getElementById('modalConfirmar').classList.add('active');
});

window.confirmarEliminacion = async () => {
    const id = docIdInput.value;
    try {
        await deleteDoc(doc(db, coleccion, id));
        alert("🗑️ Registro eliminado.");
        cerrarModal('modalConfirmar');
        document.getElementById('btnSalir').click();
        actualizarContador();
    } catch (e) {
        console.error("Error al eliminar: ", e);
        alert("Error al eliminar el registro.");
    }
};

// VER TABLA / ACTUALIZAR CONTADOR
async function actualizarContador() {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        totalRegistros = querySnapshot.size;
        document.getElementById('totalRegistrados').innerText = `📊 Total Registrados: ${totalRegistros}`;
    } catch (e) {
        console.error("Error al contar registros:", e);
    }
}

document.getElementById('btnVerExcel').addEventListener('click', async () => {
    const tbody = document.getElementById('tablaRegistros');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando datos...</td></tr>';
    document.getElementById('modalRegistros').classList.add('active');

    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        tbody.innerHTML = "";
        
        if(querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay registros en la nube.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.cedula || ''}</td>
                <td>${data.nombre1 || ''}</td>
                <td>${data.nombre2 || ''}</td>
                <td>${data.apellido1 || ''}</td>
                <td>${data.apellido2 || ''}</td>
                <td>${data.telefono || ''}</td>
                <td>${data.direccion || ''}</td>
                <td>
                    <button class="table-btn table-btn-edit" onclick="cargarDesdeTabla('${doc.id}')">Editar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Error al cargar datos.</td></tr>';
    }
});

// Cargar datos al formulario desde la tabla
window.cargarDesdeTabla = async (id) => {
    try {
        const docRef = doc(db, coleccion, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('cedula').value = data.cedula || "";
            document.getElementById('telefono').value = data.telefono || "";
            document.getElementById('nombre1').value = data.nombre1 || "";
            document.getElementById('nombre2').value = data.nombre2 || "";
            document.getElementById('apellido1').value = data.apellido1 || "";
            document.getElementById('apellido2').value = data.apellido2 || "";
            document.getElementById('direccion').value = data.direccion || "";
            docIdInput.value = docSnap.id;

            btnGuardar.disabled = true;
            btnEditar.disabled = false;
            btnEliminar.disabled = false;

            // Activar formulario si está bloqueado
            if (switchActivar.checked === false) {
                switchActivar.checked = true;
                switchActivar.dispatchEvent(new Event('change'));
            }

            cerrarModal('modalRegistros');
        }
    } catch (e) {
        console.error(e);
    }
};

// EXPORTAR A EXCEL (Usando la librería SheetJS)
document.getElementById('btnConsultar').addEventListener('click', async () => {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        if(querySnapshot.empty) return alert("No hay datos para exportar.");

        const datos = [];
        querySnapshot.forEach((doc) => {
            const d = doc.data();
            datos.push({
                "Cédula": d.cedula,
                "Primer Nombre": d.nombre1,
                "Segundo Nombre": d.nombre2,
                "Primer Apellido": d.apellido1,
                "Segundo Apellido": d.apellido2,
                "Teléfono": d.telefono,
                "Dirección": d.direccion
            });
        });

        // Generar Excel
        const worksheet = XLSX.utils.json_to_sheet(datos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        XLSX.writeFile(workbook, "SmartReg_Registros.xlsx");
        
    } catch (e) {
        console.error(e);
        alert("Error al exportar.");
    }
});

// Mantenimiento de modales
document.getElementById('menuRegistros').addEventListener('click', () => document.getElementById('btnVerExcel').click());
document.getElementById('menuArchivos').addEventListener('click', () => document.getElementById('modalArchivos').classList.add('active'));
document.getElementById('menuAjustes').addEventListener('click', () => document.getElementById('modalAjustes').classList.add('active'));

// Inicializar contador al cargar la página
actualizarContador();