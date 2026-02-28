console.log('🔄 Verificando Supabase...');

// Verificar si localStorage está disponible
function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        console.warn('⚠️ localStorage no disponible, usando memoria temporal');
        return false;
    }
}

const localStorageAvailable = isLocalStorageAvailable();

// Verificar si Supabase está cargado
if (typeof window.supabase === 'undefined' && typeof supabase === 'undefined') {
    console.log('❌ Supabase no está cargado, usando modo offline');
    // Crear un objeto simulado para que no dé errores
    window.supabase = {
        createClient: function() {
            console.log('📦 Usando cliente simulado de Supabase (offline)');
            return {
                from: function() {
                    return {
                        select: function() { return Promise.resolve({ data: [], error: null }); },
                        insert: function() { return Promise.resolve({ data: [], error: null }); },
                        update: function() { return Promise.resolve({ data: [], error: null }); },
                        delete: function() { return Promise.resolve({ error: null }); }
                    };
                }
            };
        }
    };
} else {
    console.log('✅ Supabase detectado correctamente');
    window.supabase = window.supabase || supabase;
}

// ============================================
// CONEXIÓN A SUPABASE
// ============================================
const SUPABASE_URL = 'https://xkuckfchcqkanmuqvrbp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdWNrZmNoY3FrYW5tdXF2cmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Nzg5ODksImV4cCI6MjA4NzU1NDk4OX0.PnyqCPVyZWlGVvhWjjnFwnbKCuI_6HbmFKTncZOrS5k';

let supabaseClient = null;
let supabaseConectado = false;

async function initSupabase() {
    try {
        console.log('🔄 Conectando a Supabase...');
        
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error('❌ Supabase SDK no está cargado correctamente');
            showToast('Usando modo local - sin conexión a nube', 'info');
            supabaseConectado = false;
            return false;
        }
        
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Probar conexión (opcional)
        try {
            const { error } = await supabaseClient.from('documentos').select('count', { count: 'exact', head: true });
            if (error) throw error;
            console.log('✅ Conectado a Supabase correctamente');
            supabaseConectado = true;
            showToast('Conectado a la nube', 'success');
        } catch (e) {
            console.warn('⚠️ Supabase conectado pero tabla no existe:', e);
            supabaseConectado = true;
        }
        
        return true;
        
    } catch (error) {
        console.warn('Error conectando a Supabase:', error);
        supabaseConectado = false;
        showToast('Usando modo local - sin conexión', 'info');
        return false;
    }
}

async function cargarDesdeSupabase() {
    if (!supabaseConectado || !supabaseClient) {
        await initSupabase();
    }
    
    if (!supabaseConectado || !supabaseClient) {
        showToast('No hay conexión con la nube', 'error');
        return;
    }
    
    showToast('Cargando datos de la nube...', 'info');
    
    const tablas = ['clientes', 'cotizaciones', 'facturas', 'productos', 'proyectos', 'documentos', 'configuracion'];
    
    for (const tabla of tablas) {
        try {
            const { data, error } = await supabaseClient.from(tabla).select('*');
            if (!error && data && data.length > 0) {
                if (localStorageAvailable) {
                    localStorage.setItem(tabla, JSON.stringify(data));
                } else {
                    DB.memoryStorage[tabla] = data;
                }
            }
        } catch (e) {
            console.warn(`Error cargando ${tabla}:`, e);
        }
    }
    
    showToast('✅ Datos cargados de la nube', 'success');
    showPage(currentPage);
}

// ============================================
// VARIABLES GLOBALES
// ============================================
let currentUser = {
    name: 'Admin SICREA',
    email: 'admin@sicrea.com',
    role: 'admin'
};

let currentPage = 'dashboard';
let currentEditingId = null;
let currentPortalClient = null;
let currentSignatureCanvas = null;
let isDrawing = false;

// ============================================
// BASE DE DATOS LOCAL (con fallback a memoria)
// ============================================
const DB = {
    memoryStorage: {
        clientes: [],
        cotizaciones: [],
        facturas: [],
        productos: [],
        proyectos: [],
        documentos: [],
        config: []
    },
    
    init() {
        console.log('Inicializando base de datos local...');
        
        if (!localStorageAvailable) {
            console.warn('⚠️ Usando almacenamiento en memoria');
            this.initMemoryData();
            return;
        }
        
        // Clientes
        if (!localStorage.getItem('clientes')) {
            localStorage.setItem('clientes', JSON.stringify([
                { 
                    id: 'cli_1', 
                    nombre: 'Empresa ABC', 
                    email: 'contacto@abc.com', 
                    telefono: '555-1234', 
                    empresa: 'ABC S.A. de C.V.',
                    rfc: 'ABC850515KL9',
                    direccion: 'Av. Reforma #123, Col. Centro, CDMX',
                    estado: 'activo',
                    notas: 'Cliente preferente',
                    fecha_registro: '2025-01-15'
                },
                { 
                    id: 'cli_2', 
                    nombre: 'Corporativo XYZ', 
                    email: 'info@xyzcorp.com', 
                    telefono: '555-5678', 
                    empresa: 'XYZ Corporativo',
                    rfc: 'XYZ920823MN7',
                    direccion: 'Av. Insurgentes #456, Col. Del Valle, CDMX',
                    estado: 'activo',
                    notas: 'Cliente importante',
                    fecha_registro: '2025-01-20'
                },
                { 
                    id: 'cli_3', 
                    nombre: 'Tienda Online SA', 
                    email: 'ventas@tiendaonline.com', 
                    telefono: '555-9012', 
                    empresa: 'Tienda Online S.A. de C.V.',
                    rfc: 'TIO780102PL4',
                    direccion: 'Av. Revolución #789, Col. Escandón, CDMX',
                    estado: 'activo',
                    notas: '',
                    fecha_registro: '2025-02-01'
                }
            ]));
        }

        // Cotizaciones
        if (!localStorage.getItem('cotizaciones')) {
            localStorage.setItem('cotizaciones', JSON.stringify([
                { 
                    id: 'cot_1', 
                    numero: 'COT-2025-001',
                    cliente_id: 'cli_1',
                    cliente_nombre: 'Empresa ABC',
                    cliente_email: 'contacto@abc.com',
                    cliente_telefono: '555-1234',
                    cliente_rfc: 'ABC850515KL9',
                    proyecto: 'Desarrollo Web Corporativo',
                    descripcion: 'Sitio web institucional con CMS',
                    items: [
                        { descripcion: 'Diseño y desarrollo web', cantidad: 1, precio: 25000, total: 25000 },
                        { descripcion: 'Hosting anual', cantidad: 1, precio: 3000, total: 3000 },
                        { descripcion: 'Certificado SSL', cantidad: 1, precio: 2000, total: 2000 }
                    ],
                    subtotal: 30000,
                    iva: 4800,
                    total: 34800,
                    estado: 'pendiente',
                    fecha_creacion: '2025-02-20',
                    validez: '2025-03-20',
                    notas: 'Incluye 3 reuniones de capacitación'
                },
                { 
                    id: 'cot_2', 
                    numero: 'COT-2025-002',
                    cliente_id: 'cli_2',
                    cliente_nombre: 'Corporativo XYZ',
                    cliente_email: 'info@xyzcorp.com',
                    cliente_telefono: '555-5678',
                    cliente_rfc: 'XYZ920823MN7',
                    proyecto: 'Sistema CRM Empresarial',
                    descripcion: 'CRM personalizado con módulos de ventas y soporte',
                    items: [
                        { descripcion: 'Licencias CRM (10 usuarios)', cantidad: 10, precio: 1500, total: 15000 },
                        { descripcion: 'Implementación', cantidad: 1, precio: 25000, total: 25000 },
                        { descripcion: 'Capacitación', cantidad: 1, precio: 8000, total: 8000 }
                    ],
                    subtotal: 48000,
                    iva: 7680,
                    total: 55680,
                    estado: 'aprobada',
                    fecha_creacion: '2025-02-18',
                    validez: '2025-03-18',
                    notas: 'Entrega en 4 semanas',
                    orden_compra: 'OC-2025-089'
                },
                { 
                    id: 'cot_3', 
                    numero: 'COT-2025-003',
                    cliente_id: 'cli_3',
                    cliente_nombre: 'Tienda Online SA',
                    cliente_email: 'ventas@tiendaonline.com',
                    cliente_telefono: '555-9012',
                    cliente_rfc: 'TIO780102PL4',
                    proyecto: 'Plataforma E-commerce',
                    descripcion: 'Tienda online con pasarela de pago',
                    items: [
                        { descripcion: 'Desarrollo e-commerce', cantidad: 1, precio: 35000, total: 35000 },
                        { descripcion: 'Integración de pagos', cantidad: 1, precio: 5000, total: 5000 },
                        { descripcion: 'Módulo de inventarios', cantidad: 1, precio: 8000, total: 8000 }
                    ],
                    subtotal: 48000,
                    iva: 7680,
                    total: 55680,
                    estado: 'enviada',
                    fecha_creacion: '2025-02-22',
                    validez: '2025-03-22',
                    notas: ''
                }
            ]));
        }

        // Facturas
        if (!localStorage.getItem('facturas')) {
            localStorage.setItem('facturas', JSON.stringify([
                {
                    id: 'fac_1',
                    numero: 'FAC-2025-001',
                    cotizacion_id: 'cot_2',
                    cotizacion_numero: 'COT-2025-002',
                    cliente_id: 'cli_2',
                    cliente_nombre: 'Corporativo XYZ',
                    monto: 55680,
                    fecha_emision: '2025-02-25',
                    fecha_vencimiento: '2025-03-25',
                    estado: 'pagada',
                    archivo_url: null,
                    notas: ''
                },
                {
                    id: 'fac_2',
                    numero: 'FAC-2025-002',
                    cotizacion_id: 'cot_1',
                    cotizacion_numero: 'COT-2025-001',
                    cliente_id: 'cli_1',
                    cliente_nombre: 'Empresa ABC',
                    monto: 34800,
                    fecha_emision: '2025-02-23',
                    fecha_vencimiento: '2025-03-23',
                    estado: 'pendiente',
                    archivo_url: null,
                    notas: 'Pago a 30 días'
                }
            ]));
        }

        // Productos
        if (!localStorage.getItem('productos')) {
            localStorage.setItem('productos', JSON.stringify([
                {
                    id: 'prod_1',
                    codigo: 'PROD-001',
                    nombre: 'Base Floculante',
                    categoria: 'Químicos',
                    descripcion: 'Base floculante para tratamiento de agua',
                    precio: 45.50,
                    costo: 32.00,
                    stock: 150,
                    stock_minimo: 20,
                    unidad: 'kg'
                },
                {
                    id: 'prod_2',
                    codigo: 'PROD-002',
                    nombre: 'Clarificador',
                    categoria: 'Químicos',
                    descripcion: 'Clarificador para piscinas',
                    precio: 78.00,
                    costo: 52.00,
                    stock: 8,
                    stock_minimo: 15,
                    unidad: 'litro'
                },
                {
                    id: 'prod_3',
                    codigo: 'PROD-003',
                    nombre: 'Bomba Dosificadora',
                    categoria: 'Equipos',
                    descripcion: 'Bomba para dosificación de químicos',
                    precio: 1250.00,
                    costo: 890.00,
                    stock: 3,
                    stock_minimo: 5,
                    unidad: 'pieza'
                }
            ]));
        }

        // Proyectos
        if (!localStorage.getItem('proyectos')) {
            localStorage.setItem('proyectos', JSON.stringify([
                {
                    id: 'proj_1',
                    nombre: 'Desarrollo Web ABC',
                    cliente_id: 'cli_1',
                    cliente_nombre: 'Empresa ABC',
                    descripcion: 'Desarrollo de sitio web corporativo',
                    cotizacion_id: 'cot_1',
                    cotizacion_numero: 'COT-2025-001',
                    estado: 'en_progreso',
                    prioridad: 'alta',
                    fecha_inicio: '2025-02-20',
                    fecha_fin: '2025-03-30',
                    progreso: 65,
                    presupuesto: 34800,
                    tareas: [
                        { nombre: 'Diseño de interfaces', completada: true, fecha_limite: '2025-02-25' },
                        { nombre: 'Desarrollo frontend', completada: true, fecha_limite: '2025-03-05' },
                        { nombre: 'Desarrollo backend', completada: false, fecha_limite: '2025-03-15' },
                        { nombre: 'Pruebas', completada: false, fecha_limite: '2025-03-25' }
                    ]
                },
                {
                    id: 'proj_2',
                    nombre: 'Sistema CRM XYZ',
                    cliente_id: 'cli_2',
                    cliente_nombre: 'Corporativo XYZ',
                    descripcion: 'Implementación de CRM empresarial',
                    cotizacion_id: 'cot_2',
                    cotizacion_numero: 'COT-2025-002',
                    estado: 'en_progreso',
                    prioridad: 'media',
                    fecha_inicio: '2025-02-15',
                    fecha_fin: '2025-04-15',
                    progreso: 30,
                    presupuesto: 55680,
                    tareas: [
                        { nombre: 'Análisis de requerimientos', completada: true, fecha_limite: '2025-02-20' },
                        { nombre: 'Configuración inicial', completada: true, fecha_limite: '2025-02-28' },
                        { nombre: 'Personalización', completada: false, fecha_limite: '2025-03-20' }
                    ]
                }
            ]));
        }

        // Documentos
        if (!localStorage.getItem('documentos')) {
            localStorage.setItem('documentos', JSON.stringify([
                {
                    id: 'doc_1',
                    titulo: 'Contrato de Servicios - ABC',
                    descripcion: 'Contrato para desarrollo web',
                    cliente_id: 'cli_1',
                    cliente_nombre: 'Empresa ABC',
                    cliente_email: 'contacto@abc.com',
                    archivo_url: null,
                    estado: 'pendiente',
                    fecha_envio: '2025-02-20',
                    expiracion: '2025-03-20'
                },
                {
                    id: 'doc_2',
                    titulo: 'Acuerdo de Confidencialidad',
                    descripcion: 'NDA para proyecto XYZ',
                    cliente_id: 'cli_2',
                    cliente_nombre: 'Corporativo XYZ',
                    cliente_email: 'info@xyzcorp.com',
                    archivo_url: null,
                    estado: 'firmado',
                    fecha_envio: '2025-02-15',
                    fecha_firma: '2025-02-18',
                    expiracion: '2025-03-15'
                }
            ]));
        }

        // Configuración
        if (!localStorage.getItem('config')) {
            localStorage.setItem('config', JSON.stringify({
                id: 'config_1',
                empresa: 'PIARA GPE ARROYO CASTILLO',
                rfc: 'AOCBZ3P',
                direccion: 'APODACA NL',
                telefono: '81 2886 5333',
                email: 'arroyo.piara@gmail.com',
                website: 'www.empresa.com',
                logo_url: null,
                color_primario: '#15115f',
                color_secundario: '#10b981',
                footer_text: 'Gracias por su preferencia',
                terms_conditions: '1. Incluye suministro de materiales, mano de obra e insumos\n2. Entrega en Sucursal Monterrey o area metropolitana. Común acuerdo con cliente\n3. Requiere Orden de compra al correo arroyo.piara@gmail.com y finiquito a la entrega.\n4. Metodo de pago: Transferencia\n5. Precios sujetos a cambios',
                notificaciones: true,
                alertas_stock: true,
                pdf_format: {
                    quote_title: 'COTIZACIÓN',
                    client_section_title: 'CLIENTE',
                    items_section_title: 'DESCRIPCIÓN',
                    show_client_email: true,
                    show_client_phone: true,
                    show_client_tax_id: true,
                    show_valid_until: true,
                    show_notes: true,
                    show_terms: true,
                    show_footer: true
                }
            }));
        }
    },

    initMemoryData() {
        this.memoryStorage = {
            clientes: [
                { id: 'cli_1', nombre: 'Empresa ABC', email: 'contacto@abc.com', telefono: '555-1234', empresa: 'ABC S.A. de C.V.', rfc: 'ABC850515KL9', estado: 'activo' }
            ],
            cotizaciones: [
                { id: 'cot_1', numero: 'COT-2025-001', cliente_id: 'cli_1', cliente_nombre: 'Empresa ABC', proyecto: 'Desarrollo Web', total: 34800, estado: 'pendiente', fecha_creacion: '2025-02-20' }
            ],
            facturas: [
                { id: 'fac_1', numero: 'FAC-2025-001', cliente_id: 'cli_1', cliente_nombre: 'Empresa ABC', monto: 34800, estado: 'pendiente' }
            ],
            productos: [],
            proyectos: [],
            documentos: [],
            config: [{
                id: 'config_1',
                empresa: 'PIARA GPE ARROYO CASTILLO',
                rfc: 'AOCBZ3P',
                direccion: 'APODACA NL',
                telefono: '81 2886 5333',
                email: 'arroyo.piara@gmail.com'
            }]
        };
    },

    get(collection) {
        if (!localStorageAvailable) {
            return this.memoryStorage[collection] || [];
        }
        try {
            const data = localStorage.getItem(collection);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error leyendo ${collection}:`, e);
            return [];
        }
    },

    set(collection, data) {
        if (!localStorageAvailable) {
            this.memoryStorage[collection] = data;
            return;
        }
        try {
            localStorage.setItem(collection, JSON.stringify(data));
        } catch (e) {
            console.error(`Error escribiendo ${collection}:`, e);
        }
    },

    add(collection, item) {
        const items = this.get(collection);
        const newItem = { ...item };
        items.push(newItem);
        this.set(collection, items);
        return newItem;
    },

    update(collection, id, updates) {
        const items = this.get(collection);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.set(collection, items);
            return items[index];
        }
        return null;
    },

    delete(collection, id) {
        const items = this.get(collection);
        const filtered = items.filter(i => i.id !== id);
        this.set(collection, filtered);
    },

    getById(collection, id) {
        const items = this.get(collection);
        return items.find(i => i.id === id) || null;
    },

    query(collection, filters) {
        const items = this.get(collection);
        return items.filter(item => {
            for (let key in filters) {
                if (item[key] !== filters[key]) return false;
            }
            return true;
        });
    }
};

// ============================================
// FUNCIONES DE SUPABASE (CORREGIDAS)
// ============================================
const SupabaseDB = {
    async getAll(collection) {
        if (!supabaseConectado || !supabaseClient) return DB.get(collection);
        
        try {
            const { data, error } = await supabaseClient
                .from(collection)
                .select('*');
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`Error obteniendo ${collection}:`, error);
            return DB.get(collection);
        }
    },
    
    async getById(collection, id) {
        if (!supabaseConectado || !supabaseClient) return DB.getById(collection, id);
        
        try {
            const { data, error } = await supabaseClient
                .from(collection)
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error obteniendo ${collection} por ID:`, error);
            return DB.getById(collection, id);
        }
    },
    
    async add(collection, item) {
        if (!supabaseConectado || !supabaseClient) return DB.add(collection, item);
        
        try {
            const { data, error } = await supabaseClient
                .from(collection)
                .insert([item])
                .select();
                
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error(`Error agregando a ${collection}:`, error);
            return DB.add(collection, item);
        }
    },
    
    async update(collection, id, updates) {
        if (!supabaseConectado || !supabaseClient) return DB.update(collection, id, updates);
        
        try {
            const { data, error } = await supabaseClient
                .from(collection)
                .update(updates)
                .eq('id', id)
                .select();
                
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error(`Error actualizando ${collection}:`, error);
            return DB.update(collection, id, updates);
        }
    },
    
    async delete(collection, id) {
        if (!supabaseConectado || !supabaseClient) return DB.delete(collection, id);
        
        try {
            const { error } = await supabaseClient
                .from(collection)
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error eliminando de ${collection}:`, error);
            DB.delete(collection, id);
            return false;
        }
    }
};

// ============================================
// UTILIDADES
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '-';
    }
}

function formatDateLong(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// NOTIFICACIONES TOAST
// ============================================
function showToast(message, type = 'info', title = '') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast_' + Date.now();
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ============================================
// NAVEGACIÓN
// ============================================
function showPage(pageId) {
    console.log('Mostrando página:', pageId);
    currentPage = pageId;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const menuItem = document.querySelector(`.menu-item[data-page="${pageId}"]`);
    if (menuItem) menuItem.classList.add('active');
    
    loadPageContent(pageId);
    updateBadges();

    // Cerrar menú en móviles
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar')?.classList.remove('show');
        document.getElementById('sidebarOverlay')?.classList.remove('show');
    }
}

function loadPageContent(pageId) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    switch(pageId) {
        case 'dashboard':
            mainContent.innerHTML = renderDashboard();
            break;
        case 'cotizaciones':
            mainContent.innerHTML = renderCotizaciones();
            break;
        case 'facturacion':
            mainContent.innerHTML = renderFacturacion();
            break;
        case 'inventario':
            mainContent.innerHTML = renderInventario();
            break;
        case 'proyectos':
            mainContent.innerHTML = renderProyectos();
            break;
        case 'firmas':
            mainContent.innerHTML = renderFirmas();
            break;
        case 'clientes':
            mainContent.innerHTML = renderClientes();
            break;
        case 'portal':
            showPortalLogin();
            break;
        case 'config':
            mainContent.innerHTML = renderConfiguracion();
            break;
        default:
            mainContent.innerHTML = renderDashboard();
    }
}

function toggleUserMenu() {
    document.getElementById('userMenu')?.classList.toggle('show');
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        showToast('Sesión cerrada', 'info');
        showPage('dashboard');
    }
}

function mostrarNotificaciones() {
    showToast('No hay notificaciones nuevas', 'info');
}

function updateBadges() {
    const cotizaciones = DB.get('cotizaciones');
    const facturas = DB.get('facturas');
    const productos = DB.get('productos');
    const proyectos = DB.get('proyectos');
    const documentos = DB.get('documentos');
    const clientes = DB.get('clientes');
    
    const pendientes = cotizaciones.filter(c => c.estado === 'pendiente' || c.estado === 'enviada').length;
    document.getElementById('cotizacionesBadge').textContent = pendientes || '';
    
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente').length;
    document.getElementById('facturasBadge').textContent = facturasPendientes || '';
    
    const bajoStock = productos.filter(p => p.stock <= p.stock_minimo).length;
    document.getElementById('inventarioBadge').textContent = bajoStock || '';
    
    const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso').length;
    document.getElementById('proyectosBadge').textContent = proyectosActivos || '';
    
    const docsPendientes = documentos.filter(d => d.estado === 'pendiente').length;
    document.getElementById('firmasBadge').textContent = docsPendientes || '';
    
    document.getElementById('clientesBadge').textContent = clientes.length || '';
}

// ============================================
// FUNCIONES DEL MENÚ HAMBURGUESA
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

// ============================================
// MODALES - CON BLOQUEO
// ============================================
function openModal(modalType) {
    if (document.body.dataset.modalAbriendo === 'true') return;
    document.body.dataset.modalAbriendo = 'true';

    console.log('Abriendo modal:', modalType);
    
    let modalContent = '';
    
    switch(modalType) {
        case 'nuevaCotizacion':
            modalContent = renderNuevaCotizacionModal();
            break;
        case 'nuevaFactura':
            modalContent = renderNuevaFacturaModal();
            break;
        case 'nuevoProducto':
            modalContent = renderNuevoProductoModal();
            break;
        case 'nuevoProyecto':
            modalContent = renderNuevoProyectoModal();
            break;
        case 'nuevoDocumento':
            modalContent = renderNuevoDocumentoModal();
            break;
        case 'nuevoCliente':
            modalContent = renderNuevoClienteModal();
            break;
        default:
            document.body.dataset.modalAbriendo = 'false';
            return;
    }
    
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;

    setTimeout(() => { 
        document.body.dataset.modalAbriendo = 'false'; 
    }, 300);
}

function closeModal() {
    const modal = document.getElementById('activeModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            document.getElementById('modalContainer').innerHTML = '';
        }, 300);
    }
}

// ============================================
// RENDER DASHBOARD
// ============================================
function renderDashboard() {
    const cotizaciones = DB.get('cotizaciones');
    const proyectos = DB.get('proyectos');
    const clientes = DB.get('clientes');
    const productos = DB.get('productos');
    const facturas = DB.get('facturas');
    
    const cotizacionesPendientes = cotizaciones.filter(c => c.estado === 'pendiente' || c.estado === 'enviada').length;
    const proyectosActivos = proyectos.filter(p => p.estado === 'en_progreso').length;
    const productosBajoStock = productos.filter(p => p.stock <= p.stock_minimo).length;
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente').length;
    
    const fechaStr = new Date().toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return `
        <div class="page-header">
            <div>
                <h1>Dashboard</h1>
                <p>Bienvenido de vuelta, ${currentUser.name}</p>
            </div>
            <div class="date-display">
                <i class="far fa-calendar-alt mr-2"></i>
                ${fechaStr}
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Cotizaciones</h3>
                    <i class="fas fa-file-invoice-dollar"></i>
                </div>
                <div class="stat-number">${cotizaciones.length}</div>
                <div class="stat-detail">${cotizacionesPendientes} pendientes</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Facturación</h3>
                    <i class="fas fa-receipt"></i>
                </div>
                <div class="stat-number">${facturas.length}</div>
                <div class="stat-detail">${facturasPendientes} pendientes</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Proyectos</h3>
                    <i class="fas fa-tasks"></i>
                </div>
                <div class="stat-number">${proyectosActivos}</div>
                <div class="stat-detail">activos de ${proyectos.length}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Inventario</h3>
                    <i class="fas fa-boxes"></i>
                </div>
                <div class="stat-number">${productos.length}</div>
                <div class="stat-detail">${productosBajoStock} bajo stock</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>Cotizaciones Recientes</h3>
                <button class="btn-link" onclick="showPage('cotizaciones')">Ver todas</button>
            </div>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Proyecto</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cotizaciones.slice(0, 5).map(c => `
                            <tr>
                                <td>${c.cliente_nombre || 'Cliente no disponible'}</td>
                                <td>${c.proyecto}</td>
                                <td>${formatCurrency(c.total || 0)}</td>
                                <td><span class="badge badge-${c.estado === 'aprobada' ? 'success' : c.estado === 'pendiente' ? 'warning' : c.estado === 'enviada' ? 'info' : 'danger'}">${capitalize(c.estado)}</span></td>
                            </tr>
                        `).join('')}
                        ${cotizaciones.length === 0 ? '<tr><td colspan="4" class="text-center p-4">No hay cotizaciones</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================
// RENDER COTIZACIONES
// ============================================
function renderCotizaciones() {
    const cotizaciones = DB.get('cotizaciones');
    
    return `
        <div class="page-header">
            <div>
                <h1>Cotizaciones</h1>
                <p>Gestiona tus cotizaciones y propuestas</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevaCotizacion')">
                <i class="fas fa-plus"></i> Nueva Cotización
            </button>
        </div>
        
        <div class="filters">
            <div class="filter-tabs">
                <button class="filter-tab active" onclick="filtrarCotizaciones('todas', this)">Todas (${cotizaciones.length})</button>
                <button class="filter-tab" onclick="filtrarCotizaciones('pendiente', this)">Pendientes (${cotizaciones.filter(c => c.estado === 'pendiente').length})</button>
                <button class="filter-tab" onclick="filtrarCotizaciones('enviada', this)">Enviadas (${cotizaciones.filter(c => c.estado === 'enviada').length})</button>
                <button class="filter-tab" onclick="filtrarCotizaciones('aprobada', this)">Aprobadas (${cotizaciones.filter(c => c.estado === 'aprobada').length})</button>
            </div>
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar cotizaciones..." id="buscarCotizacion" onkeyup="buscarCotizaciones()">
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="data-table" id="tablaCotizaciones">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Proyecto</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                            <th>Válida</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cotizaciones.map(c => `
                            <tr data-id="${c.id}" data-estado="${c.estado}">
                                <td class="font-mono">${c.numero || 'COT-' + c.id.slice(-4)}</td>
                                <td>${c.cliente_nombre || 'Cliente no disponible'}</td>
                                <td>${c.proyecto}</td>
                                <td>${formatCurrency(c.total || 0)}</td>
                                <td>${c.fecha_creacion ? formatDate(c.fecha_creacion) : '-'}</td>
                                <td>${c.validez ? formatDate(c.validez) : '-'}</td>
                                <td><span class="badge badge-${c.estado === 'aprobada' ? 'success' : c.estado === 'pendiente' ? 'warning' : c.estado === 'enviada' ? 'info' : 'danger'}">${capitalize(c.estado)}</span></td>
                                <td>
                                    <div class="acciones-botones">
                                        <button class="btn-icon" onclick="verCotizacion('${c.id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-icon" onclick="editarCotizacion('${c.id}')" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        ${c.estado !== 'aprobada' ? `
                                            <button class="btn-icon" onclick="aprobarCotizacion('${c.id}')" title="Aprobar">
                                                <i class="fas fa-check-circle text-success"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon" onclick="duplicarCotizacion('${c.id}')" title="Duplicar">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <button class="btn-icon" onclick="descargarCotizacionPDF('${c.id}')" title="Descargar PDF">
                                            <i class="fas fa-file-pdf"></i>
                                        </button>
                                        <button class="btn-icon" onclick="eliminarCotizacion('${c.id}')" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${cotizaciones.length === 0 ? `
                            <tr>
                                <td colspan="8" class="text-center p-4">
                                    <div class="empty-state">
                                        <i class="fas fa-file-invoice-dollar"></i>
                                        <h3>No hay cotizaciones</h3>
                                        <p>Comienza creando tu primera cotización</p>
                                        <button class="btn btn-primary" onclick="openModal('nuevaCotizacion')">
                                            <i class="fas fa-plus"></i> Nueva Cotización
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================
// FILTROS
// ============================================
function filtrarCotizaciones(filtro, elemento) {
    document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
    elemento.classList.add('active');
    
    const filas = document.querySelectorAll('#tablaCotizaciones tbody tr');
    filas.forEach(fila => {
        if (filtro === 'todas') {
            fila.style.display = '';
        } else {
            const estado = fila.getAttribute('data-estado');
            fila.style.display = estado === filtro ? '' : 'none';
        }
    });
}

function buscarCotizaciones() {
    const termino = document.getElementById('buscarCotizacion')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('#tablaCotizaciones tbody tr');
    
    filas.forEach(fila => {
        if (fila.style.display !== 'none') {
            const texto = fila.textContent.toLowerCase();
            fila.style.display = texto.includes(termino) ? '' : 'none';
        }
    });
}

// ============================================
// ACCIONES DE COTIZACIONES
// ============================================
function aprobarCotizacion(id) {
    if (aprobarCotizacion.procesando) return;
    aprobarCotizacion.procesando = true;

    if (confirm('¿Marcar esta cotización como aprobada?')) {
        DB.update('cotizaciones', id, { estado: 'aprobada' });
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.update('cotizaciones', id, { estado: 'aprobada' }).catch(e => console.warn(e));
        }
        showToast('Cotización aprobada', 'success');
        showPage('cotizaciones');
    }
    aprobarCotizacion.procesando = false;
}

function verCotizacion(id) {
    const cot = DB.getById('cotizaciones', id);
    if (!cot) return;
    
    const items = cot.items || [{ descripcion: cot.proyecto, cantidad: 1, precio: cot.total || 0, total: cot.total || 0 }];
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-file-invoice-dollar"></i> Cotización ${cot.numero || ''}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="mb-4">
                <p><strong>Cliente:</strong> ${cot.cliente_nombre || 'Cliente no disponible'}</p>
                <p><strong>Email:</strong> ${cot.cliente_email || '-'}</p>
                <p><strong>Teléfono:</strong> ${cot.cliente_telefono || '-'}</p>
                <p><strong>RFC:</strong> ${cot.cliente_rfc || '-'}</p>
                <p><strong>Fecha:</strong> ${cot.fecha_creacion ? formatDate(cot.fecha_creacion) : '-'}</p>
                <p><strong>Válida hasta:</strong> ${cot.validez ? formatDate(cot.validez) : '-'}</p>
                <p><strong>Estado:</strong> <span class="badge badge-${cot.estado === 'aprobada' ? 'success' : cot.estado === 'pendiente' ? 'warning' : cot.estado === 'enviada' ? 'info' : 'danger'}">${capitalize(cot.estado)}</span></p>
            </div>
            
            <h3 class="font-semibold mb-2">Conceptos</h3>
            <table class="data-table mb-4">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Precio</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.descripcion}</td>
                            <td class="text-right">${item.cantidad}</td>
                            <td class="text-right">${formatCurrency(item.precio)}</td>
                            <td class="text-right">${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right font-bold">Total:</td>
                        <td class="text-right font-bold">${formatCurrency(cot.total || 0)}</td>
                    </tr>
                </tfoot>
            </table>
            
            ${cot.notas ? `
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Notas</h3>
                    <p>${cot.notas}</p>
                </div>
            ` : ''}
            
            <div class="flex justify-end gap-2">
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

function editarCotizacion(id) {
    const cot = DB.getById('cotizaciones', id);
    if (!cot) return;
    
    currentEditingId = id;
    
    const clientes = DB.get('clientes');
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-edit"></i> Editar Cotización</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editarCotizacionForm" onsubmit="actualizarCotizacion(event)">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select class="form-select" name="cliente_id" required>
                        ${clientes.map(c => `<option value="${c.id}" ${c.id === cot.cliente_id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Proyecto *</label>
                    <input type="text" class="form-input" name="proyecto" value="${cot.proyecto || ''}" required>
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="3">${cot.descripcion || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Monto *</label>
                        <input type="number" class="form-input" name="monto" value="${cot.total || 0}" required step="0.01" min="0">
                    </div>
                    
                    <div class="form-group">
                        <label>Válida hasta</label>
                        <input type="date" class="form-input" name="validez" value="${cot.validez || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Estado</label>
                    <select class="form-select" name="estado">
                        <option value="pendiente" ${cot.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="enviada" ${cot.estado === 'enviada' ? 'selected' : ''}>Enviada</option>
                        <option value="aprobada" ${cot.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option>
                        <option value="rechazada" ${cot.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Notas</label>
                    <textarea class="form-textarea" name="notas" rows="2">${cot.notas || ''}</textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

async function actualizarCotizacion(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        const clienteId = formData.get('cliente_id');
        const cliente = DB.getById('clientes', clienteId);
        
        if (!cliente) {
            showToast('Cliente no encontrado', 'error');
            return;
        }
        
        const monto = parseFloat(formData.get('monto')) || 0;
        
        const actualizacion = {
            cliente_id: clienteId,
            cliente_nombre: cliente.nombre,
            cliente_email: cliente.email,
            cliente_telefono: cliente.telefono || '',
            cliente_rfc: cliente.rfc || '',
            proyecto: formData.get('proyecto'),
            descripcion: formData.get('descripcion'),
            total: monto,
            estado: formData.get('estado'),
            validez: formData.get('validez'),
            notas: formData.get('notas') || '',
            items: [{ descripcion: formData.get('proyecto'), cantidad: 1, precio: monto, total: monto }]
        };
        
        DB.update('cotizaciones', currentEditingId, actualizacion);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.update('cotizaciones', currentEditingId, actualizacion).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Cotización actualizada correctamente', 'success');
        showPage('cotizaciones');
        
    } catch (error) {
        console.error(error);
        showToast('Error al actualizar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function duplicarCotizacion(id) {
    const cot = DB.getById('cotizaciones', id);
    if (!cot) return;
    
    const cotizaciones = DB.get('cotizaciones');
    
    const nuevaCot = {
        ...cot,
        id: 'cot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        numero: `COT-${new Date().getFullYear()}-${String(cotizaciones.length + 1).padStart(3, '0')}`,
        estado: 'pendiente',
        fecha_creacion: new Date().toISOString().split('T')[0]
    };
    
    DB.add('cotizaciones', nuevaCot);
    
    if (supabaseConectado && supabaseClient) {
        SupabaseDB.add('cotizaciones', nuevaCot).catch(e => console.warn(e));
    }
    
    showToast('Cotización duplicada correctamente', 'success');
    showPage('cotizaciones');
}

function eliminarCotizacion(id) {
    if (eliminarCotizacion.procesando) return;
    eliminarCotizacion.procesando = true;

    if (confirm('¿Estás seguro de eliminar esta cotización?')) {
        DB.delete('cotizaciones', id);
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('cotizaciones', id).catch(e => console.warn(e));
        }
        
        showToast('Cotización eliminada', 'info');
        showPage('cotizaciones');
    }
    eliminarCotizacion.procesando = false;
}

function descargarCotizacionPDF(id) {
    const cot = DB.getById('cotizaciones', id);
    if (!cot) {
        showToast('Cotización no encontrada', 'error');
        return;
    }
    
    const config = DB.get('config')[0] || {};
    const format = config.pdf_format || {
        show_client_email: true,
        show_client_phone: true,
        show_client_tax_id: true,
        show_valid_until: true,
        show_notes: true,
        show_terms: true,
        show_footer: true,
        quote_title: 'COTIZACIÓN',
        client_section_title: 'CLIENTE',
        items_section_title: 'DESCRIPCIÓN'
    };
    
    showToast('Generando PDF...', 'info', 'Procesando');
    
    setTimeout(() => {
        const contenido = generarContenidoPDF(cot, config, format);
        
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cotizacion_${cot.numero || id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('PDF descargado', 'success');
    }, 1500);
}

function generarContenidoPDF(cot, config, format) {
    const cliente = DB.getById('clientes', cot.cliente_id) || {};
    
    const fecha = formatDateLong(new Date());
    const fechaValidez = cot.validez ? formatDateLong(cot.validez) : formatDateLong(new Date(Date.now() + 30*24*60*60*1000));
    
    let contenido = '';
    
    contenido += '═'.repeat(70) + '\n\n';
    
    contenido += `${config.empresa || 'PIARA GPE ARROYO CASTILLO'}\n`;
    contenido += `${config.direccion || 'APODACA NL'}\n`;
    contenido += `Tel: ${config.telefono || '81 2886 5333'} Email: ${config.email || 'arroyo.piara@gmail.com'}\n`;
    if (config.rfc) contenido += `RFC: ${config.rfc}\n`;
    contenido += '\n';
    contenido += `Fecha: ${fecha} Válida hasta: ${fechaValidez}\n\n`;
    
    contenido += '═'.repeat(70) + '\n\n';
    
    contenido += `${format.client_section_title || 'CLIENTE'}\n`;
    contenido += '─'.repeat(50) + '\n';
    contenido += `${cot.cliente_nombre}\n`;
    if (format.show_client_email) contenido += `Email: ${cot.cliente_email || cliente.email || '-'}\n`;
    if (format.show_client_phone) contenido += `Tel: ${cot.cliente_telefono || cliente.telefono || '-'}\n`;
    if (format.show_client_tax_id) contenido += `RFC: ${cot.cliente_rfc || cliente.rfc || '-'}\n`;
    contenido += '\n';
    
    contenido += `${format.items_section_title || 'DESCRIPCIÓN'}\n`;
    contenido += '─'.repeat(70) + '\n';
    contenido += 'DESCRIPCIÓN' + ' '.repeat(30) + 'CANT.  PRECIO UNIT.  TOTAL\n';
    contenido += '─'.repeat(70) + '\n';
    
    const items = cot.items || [{ 
        descripcion: cot.proyecto, 
        cantidad: 1, 
        precio: cot.total || 0, 
        total: cot.total || 0 
    }];
    
    items.forEach(item => {
        const descripcion = item.descripcion.substring(0, 30).padEnd(32);
        const cantidad = item.cantidad.toString().padStart(4);
        const precio = formatCurrency(item.precio).padStart(12);
        const total = formatCurrency(item.total).padStart(10);
        contenido += `${descripcion}${cantidad}${precio}${total}\n`;
    });
    
    contenido += '─'.repeat(70) + '\n';
    
    const subtotal = cot.subtotal || items.reduce((sum, i) => sum + i.total, 0);
    const iva = cot.iva || subtotal * 0.16;
    const total = cot.total || subtotal + iva;
    
    contenido += `Subtotal:${formatCurrency(subtotal).padStart(50)}\n`;
    contenido += `IVA (16%):${formatCurrency(iva).padStart(48)}\n`;
    contenido += `TOTAL:${formatCurrency(total).padStart(51)}\n\n`;
    
    if (format.show_terms && config.terms_conditions) {
        contenido += '═'.repeat(70) + '\n\n';
        contenido += `TÉRMINOS Y CONDICIONES\n`;
        contenido += '─'.repeat(50) + '\n';
        contenido += config.terms_conditions + '\n\n';
    }
    
    if (format.show_notes && cot.notas) {
        contenido += `NOTAS\n`;
        contenido += '─'.repeat(50) + '\n';
        contenido += cot.notas + '\n\n';
    }
    
    if (format.show_footer && config.footer_text) {
        contenido += '═'.repeat(70) + '\n';
        contenido += config.footer_text + '\n';
    }
    
    return contenido;
}

// ============================================
// RENDER FACTURACIÓN
// ============================================
function renderFacturacion() {
    const facturas = DB.get('facturas');
    
    const totalFacturado = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
    const pagado = facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + (f.monto || 0), 0);
    const pendiente = facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + (f.monto || 0), 0);
    
    return `
        <div class="page-header">
            <div>
                <h1>Facturación</h1>
                <p>Sube y gestiona tus facturas</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevaFactura')">
                <i class="fas fa-upload"></i> Subir Factura
            </button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Facturado</h3>
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-number">${formatCurrency(totalFacturado)}</div>
                <div class="stat-detail">${facturas.length} facturas</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Pagado</h3>
                    <i class="fas fa-check-circle text-success"></i>
                </div>
                <div class="stat-number">${formatCurrency(pagado)}</div>
                <div class="stat-detail">${facturas.filter(f => f.estado === 'pagada').length} facturas</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Pendiente</h3>
                    <i class="fas fa-clock text-warning"></i>
                </div>
                <div class="stat-number">${formatCurrency(pendiente)}</div>
                <div class="stat-detail">${facturas.filter(f => f.estado === 'pendiente').length} facturas</div>
            </div>
        </div>
        
        <div class="filters">
            <div class="filter-tabs">
                <button class="filter-tab active" onclick="filtrarFacturas('todas', this)">Todas (${facturas.length})</button>
                <button class="filter-tab" onclick="filtrarFacturas('pendiente', this)">Pendientes (${facturas.filter(f => f.estado === 'pendiente').length})</button>
                <button class="filter-tab" onclick="filtrarFacturas('pagada', this)">Pagadas (${facturas.filter(f => f.estado === 'pagada').length})</button>
            </div>
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar facturas..." id="buscarFactura" onkeyup="buscarFacturas()">
            </div>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="data-table" id="tablaFacturas">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Monto</th>
                            <th>Emisión</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${facturas.map(f => `
                            <tr data-id="${f.id}" data-estado="${f.estado}">
                                <td class="font-mono">${f.numero}</td>
                                <td>${f.cliente_nombre || 'Cliente no disponible'}</td>
                                <td>${formatCurrency(f.monto)}</td>
                                <td>${f.fecha_emision ? formatDate(f.fecha_emision) : '-'}</td>
                                <td>${f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : '-'}</td>
                                <td><span class="badge badge-${f.estado === 'pagada' ? 'success' : f.estado === 'pendiente' ? 'warning' : 'danger'}">${capitalize(f.estado)}</span></td>
                                <td>
                                    <div class="acciones-botones">
                                        <button class="btn-icon" onclick="verFactura('${f.id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${f.estado === 'pendiente' ? `
                                            <button class="btn-icon" onclick="marcarFacturaPagada('${f.id}')" title="Marcar como pagada">
                                                <i class="fas fa-check-circle text-success"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon" onclick="eliminarFactura('${f.id}')" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${facturas.length === 0 ? `
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <div class="empty-state">
                                        <i class="fas fa-receipt"></i>
                                        <h3>No hay facturas</h3>
                                        <p>Sube tu primera factura</p>
                                        <button class="btn btn-primary" onclick="openModal('nuevaFactura')">
                                            <i class="fas fa-upload"></i> Subir Factura
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filtrarFacturas(filtro, elemento) {
    document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
    elemento.classList.add('active');
    
    const filas = document.querySelectorAll('#tablaFacturas tbody tr');
    filas.forEach(fila => {
        if (filtro === 'todas') {
            fila.style.display = '';
        } else {
            const estado = fila.getAttribute('data-estado');
            fila.style.display = estado === filtro ? '' : 'none';
        }
    });
}

function buscarFacturas() {
    const termino = document.getElementById('buscarFactura')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('#tablaFacturas tbody tr');
    
    filas.forEach(fila => {
        if (fila.style.display !== 'none') {
            const texto = fila.textContent.toLowerCase();
            fila.style.display = texto.includes(termino) ? '' : 'none';
        }
    });
}

function verFactura(id) {
    const fact = DB.getById('facturas', id);
    if (!fact) return;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-receipt"></i> Factura ${fact.numero}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="mb-4">
                <p><strong>Cliente:</strong> ${fact.cliente_nombre || 'Cliente no disponible'}</p>
                <p><strong>Monto:</strong> ${formatCurrency(fact.monto)}</p>
                <p><strong>Fecha emisión:</strong> ${fact.fecha_emision ? formatDate(fact.fecha_emision) : '-'}</p>
                <p><strong>Fecha vencimiento:</strong> ${fact.fecha_vencimiento ? formatDate(fact.fecha_vencimiento) : '-'}</p>
                <p><strong>Estado:</strong> <span class="badge badge-${fact.estado === 'pagada' ? 'success' : fact.estado === 'pendiente' ? 'warning' : 'danger'}">${capitalize(fact.estado)}</span></p>
            </div>
            
            ${fact.notas ? `
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Notas</h3>
                    <p>${fact.notas}</p>
                </div>
            ` : ''}
            
            <div class="flex justify-end gap-2">
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

async function marcarFacturaPagada(id) {
    if (marcarFacturaPagada.procesando) return;
    marcarFacturaPagada.procesando = true;

    DB.update('facturas', id, { estado: 'pagada' });
    
    if (supabaseConectado && supabaseClient) {
        await SupabaseDB.update('facturas', id, { estado: 'pagada' }).catch(e => console.warn(e));
    }
    
    showToast('Factura marcada como pagada', 'success');
    showPage('facturacion');
    marcarFacturaPagada.procesando = false;
}

function eliminarFactura(id) {
    if (eliminarFactura.procesando) return;
    eliminarFactura.procesando = true;

    if (confirm('¿Estás seguro de eliminar esta factura?')) {
        DB.delete('facturas', id);
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('facturas', id).catch(e => console.warn(e));
        }
        
        showToast('Factura eliminada', 'info');
        showPage('facturacion');
    }
    eliminarFactura.procesando = false;
}

// ============================================
// RENDER INVENTARIO
// ============================================
function renderInventario() {
    const productos = DB.get('productos');
    
    const totalProductos = productos.length;
    const bajoStock = productos.filter(p => p.stock <= p.stock_minimo).length;
    const valorInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio), 0);
    
    return `
        <div class="page-header">
            <div>
                <h1>Inventario</h1>
                <p>Control de productos y stock</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevoProducto')">
                <i class="fas fa-plus"></i> Agregar Producto
            </button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Productos</h3>
                    <i class="fas fa-boxes"></i>
                </div>
                <div class="stat-number">${totalProductos}</div>
                <div class="stat-detail">en inventario</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Bajo Stock</h3>
                    <i class="fas fa-exclamation-triangle ${bajoStock > 0 ? 'text-warning' : ''}"></i>
                </div>
                <div class="stat-number">${bajoStock}</div>
                <div class="stat-detail">productos por reabastecer</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Valor Inventario</h3>
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-number">${formatCurrency(valorInventario)}</div>
                <div class="stat-detail">valor total</div>
            </div>
        </div>
        
        <div class="filters">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar productos..." id="buscarProducto" onkeyup="buscarProductos()">
            </div>
            <select class="filter-select" id="categoriaFilter" onchange="filtrarProductos()">
                <option value="todas">Todas las categorías</option>
                <option value="Químicos">Químicos</option>
                <option value="Equipos">Equipos</option>
                <option value="Herramientas">Herramientas</option>
            </select>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="data-table" id="tablaProductos">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Precio</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productos.map(p => {
                            const estado = p.stock <= p.stock_minimo ? 'bajo' : p.stock === 0 ? 'agotado' : 'normal';
                            return `
                                <tr data-id="${p.id}">
                                    <td class="font-mono">${p.codigo}</td>
                                    <td>${p.nombre}</td>
                                    <td>${p.categoria || '-'}</td>
                                    <td class="${estado === 'bajo' ? 'text-warning' : estado === 'agotado' ? 'text-danger' : ''}">${p.stock} ${p.unidad || ''}</td>
                                    <td>${formatCurrency(p.precio)}</td>
                                    <td>
                                        <span class="badge badge-${estado === 'normal' ? 'success' : estado === 'bajo' ? 'warning' : 'danger'}">
                                            ${estado === 'normal' ? 'Normal' : estado === 'bajo' ? 'Stock Bajo' : 'Agotado'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="acciones-botones">
                                            <button class="btn-icon" onclick="editarProducto('${p.id}')" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon" onclick="ajustarStock('${p.id}')" title="Ajustar stock">
                                                <i class="fas fa-sync-alt"></i>
                                            </button>
                                            <button class="btn-icon" onclick="eliminarProducto('${p.id}')" title="Eliminar">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${productos.length === 0 ? `
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <div class="empty-state">
                                        <i class="fas fa-boxes"></i>
                                        <h3>No hay productos</h3>
                                        <p>Agrega tu primer producto</p>
                                        <button class="btn btn-primary" onclick="openModal('nuevoProducto')">
                                            <i class="fas fa-plus"></i> Agregar Producto
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filtrarProductos() {
    const categoria = document.getElementById('categoriaFilter')?.value || 'todas';
    const termino = document.getElementById('buscarProducto')?.value.toLowerCase() || '';
    
    const filas = document.querySelectorAll('#tablaProductos tbody tr');
    filas.forEach(fila => {
        let mostrar = true;
        
        if (categoria !== 'todas') {
            const catCelda = fila.cells[2]?.textContent;
            if (catCelda !== categoria) mostrar = false;
        }
        
        if (mostrar && termino) {
            const texto = fila.textContent.toLowerCase();
            if (!texto.includes(termino)) mostrar = false;
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

function buscarProductos() {
    filtrarProductos();
}

function editarProducto(id) {
    const prod = DB.getById('productos', id);
    if (!prod) return;
    
    currentEditingId = id;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-edit"></i> Editar Producto</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editarProductoForm" onsubmit="actualizarProducto(event)">
                <div class="form-group">
                    <label>Código</label>
                    <input type="text" class="form-input" name="codigo" value="${prod.codigo || ''}">
                </div>
                
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" class="form-input" name="nombre" value="${prod.nombre}" required>
                </div>
                
                <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" class="form-input" name="categoria" value="${prod.categoria || ''}">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Precio *</label>
                        <input type="number" step="0.01" class="form-input" name="precio" value="${prod.precio}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" class="form-input" name="stock" value="${prod.stock || 0}" min="0">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Stock mínimo</label>
                    <input type="number" class="form-input" name="stock_minimo" value="${prod.stock_minimo || 5}" min="0">
                </div>
                
                <div class="form-group">
                    <label>Unidad</label>
                    <input type="text" class="form-input" name="unidad" value="${prod.unidad || 'pieza'}">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="2">${prod.descripcion || ''}</textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

async function actualizarProducto(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        
        const actualizacion = {
            codigo: formData.get('codigo'),
            nombre: formData.get('nombre'),
            categoria: formData.get('categoria'),
            precio: parseFloat(formData.get('precio')) || 0,
            stock: parseInt(formData.get('stock')) || 0,
            stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
            unidad: formData.get('unidad'),
            descripcion: formData.get('descripcion')
        };
        
        DB.update('productos', currentEditingId, actualizacion);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.update('productos', currentEditingId, actualizacion).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Producto actualizado correctamente', 'success');
        showPage('inventario');
        
    } catch (error) {
        console.error(error);
        showToast('Error al actualizar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function ajustarStock(id) {
    const prod = DB.getById('productos', id);
    if (!prod) return;
    
    currentEditingId = id;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-sync-alt"></i> Ajustar Stock: ${prod.nombre}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p class="mb-3">Stock actual: <strong>${prod.stock} ${prod.unidad || ''}</strong></p>
            
            <form id="ajustarStockForm" onsubmit="guardarAjusteStock(event)">
                <div class="form-group">
                    <label>Tipo de ajuste</label>
                    <select class="form-select" id="tipoAjuste">
                        <option value="agregar">Agregar stock</option>
                        <option value="quitar">Quitar stock</option>
                        <option value="fijar">Fijar cantidad exacta</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Cantidad</label>
                    <input type="number" class="form-input" name="cantidad" min="0" value="1" required>
                </div>
                
                <div class="form-group">
                    <label>Razón del ajuste</label>
                    <textarea class="form-textarea" name="razon" rows="2" placeholder="Ej: Compra, venta, ajuste de inventario..."></textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Aplicar Ajuste</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

async function guardarAjusteStock(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Aplicando...';
    }

    try {
        const prod = DB.getById('productos', currentEditingId);
        if (!prod) return;
        
        const tipo = document.getElementById('tipoAjuste').value;
        const cantidad = parseInt(document.querySelector('input[name="cantidad"]').value) || 0;
        
        let nuevoStock = prod.stock;
        
        if (tipo === 'agregar') {
            nuevoStock += cantidad;
        } else if (tipo === 'quitar') {
            nuevoStock = Math.max(0, nuevoStock - cantidad);
        } else if (tipo === 'fijar') {
            nuevoStock = cantidad;
        }
        
        DB.update('productos', currentEditingId, { stock: nuevoStock });
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.update('productos', currentEditingId, { stock: nuevoStock }).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast(`Stock ajustado: ${prod.stock} → ${nuevoStock} ${prod.unidad || ''}`, 'success');
        showPage('inventario');
        
    } catch (error) {
        console.error(error);
        showToast('Error al ajustar stock', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Aplicar Ajuste';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function eliminarProducto(id) {
    if (eliminarProducto.procesando) return;
    eliminarProducto.procesando = true;

    if (confirm('¿Estás seguro de eliminar este producto?')) {
        DB.delete('productos', id);
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('productos', id).catch(e => console.warn(e));
        }
        
        showToast('Producto eliminado', 'info');
        showPage('inventario');
    }
    eliminarProducto.procesando = false;
}

// ============================================
// RENDER PROYECTOS
// ============================================
function renderProyectos() {
    const proyectos = DB.get('proyectos');
    
    return `
        <div class="page-header">
            <div>
                <h1>Proyectos</h1>
                <p>Gestiona tus proyectos activos</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevoProyecto')">
                <i class="fas fa-plus"></i> Nuevo Proyecto
            </button>
        </div>
        
        <div class="filters">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar proyectos..." id="buscarProyecto" onkeyup="buscarProyectos()">
            </div>
        </div>
        
        <div class="projects-grid" id="proyectosGrid">
            ${proyectos.map(p => `
                <div class="project-card" onclick="verProyecto('${p.id}')">
                    <div class="project-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;" onclick="event.stopPropagation()">
                        <button class="btn-icon" onclick="editarProyecto('${p.id}')" title="Editar proyecto">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="eliminarProyecto('${p.id}')" title="Eliminar proyecto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <div>
                        <h4 class="project-title">${p.nombre}</h4>
                        <p class="project-client">${p.cliente_nombre || 'Sin cliente'}</p>
                    </div>
                    
                    ${p.descripcion ? `<p class="text-muted text-sm mb-3">${p.descripcion.substring(0, 100)}${p.descripcion.length > 100 ? '...' : ''}</p>` : ''}
                    
                    <div class="project-progress">
                        <div class="project-progress-info">
                            <span>Progreso</span>
                            <span>${p.progreso || 0}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${p.progreso || 0}%"></div>
                        </div>
                    </div>
                    
                    <div class="project-footer">
                        <span class="project-date">
                            <i class="far fa-calendar-alt"></i>
                            ${p.fecha_fin ? formatDate(p.fecha_fin) : 'En curso'}
                        </span>
                        <span class="badge badge-${p.estado === 'en_progreso' ? 'info' : p.estado === 'planificacion' ? 'warning' : 'success'}">
                            ${p.estado === 'en_progreso' ? 'En progreso' : p.estado === 'planificacion' ? 'Planificación' : 'Completado'}
                        </span>
                    </div>
                </div>
            `).join('')}
            ${proyectos.length === 0 ? `
                <div class="empty-state" style="grid-column: 1/-1">
                    <i class="fas fa-tasks"></i>
                    <h3>No hay proyectos</h3>
                    <p>Crea tu primer proyecto</p>
                    <button class="btn btn-primary" onclick="openModal('nuevoProyecto')">
                        <i class="fas fa-plus"></i> Nuevo Proyecto
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function buscarProyectos() {
    const termino = document.getElementById('buscarProyecto')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.project-card');
    
    cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        card.style.display = texto.includes(termino) ? '' : 'none';
    });
}

function verProyecto(id) {
    const proj = DB.getById('proyectos', id);
    if (!proj) return;
    
    const tareasCompletadas = proj.tareas?.filter(t => t.completada).length || 0;
    const totalTareas = proj.tareas?.length || 0;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-tasks"></i> ${proj.nombre}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="mb-4">
                <p><strong>Cliente:</strong> ${proj.cliente_nombre || '-'}</p>
                <p><strong>Descripción:</strong> ${proj.descripcion || '-'}</p>
                <p><strong>Fechas:</strong> ${proj.fecha_inicio ? formatDate(proj.fecha_inicio) : '-'} - ${proj.fecha_fin ? formatDate(proj.fecha_fin) : '-'}</p>
                <p><strong>Presupuesto:</strong> ${formatCurrency(proj.presupuesto || 0)}</p>
                <p><strong>Progreso:</strong> ${proj.progreso || 0}% (${tareasCompletadas}/${totalTareas} tareas)</p>
            </div>
            
            ${proj.tareas?.length > 0 ? `
                <h3 class="font-semibold mb-2">Tareas</h3>
                <div class="space-y-2 mb-4">
                    ${proj.tareas.map((t, i) => `
                        <div class="flex items-center gap-2 p-2 bg-muted rounded">
                            <input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTarea('${proj.id}', ${i}, this.checked)">
                            <span class="${t.completada ? 'text-muted line-through' : ''}">${t.nombre}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="flex justify-end gap-2">
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

function toggleTarea(projId, tareaIndex, completada) {
    const proj = DB.getById('proyectos', projId);
    if (!proj) return;
    
    proj.tareas[tareaIndex].completada = completada;
    
    const completadas = proj.tareas.filter(t => t.completada).length;
    proj.progreso = Math.round((completadas / proj.tareas.length) * 100);
    
    DB.update('proyectos', projId, proj);
    
    if (supabaseConectado && supabaseClient) {
        SupabaseDB.update('proyectos', projId, proj).catch(e => console.warn(e));
    }
}

function editarProyecto(id) {
    const proj = DB.getById('proyectos', id);
    if (!proj) return;
    currentEditingId = id;

    const clientes = DB.get('clientes');
    const tareas = proj.tareas || [];

    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-edit"></i> Editar Proyecto</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editarProyectoForm" onsubmit="guardarEdicionProyecto(event)">
                <div class="form-group">
                    <label>Nombre del proyecto *</label>
                    <input type="text" class="form-input" name="nombre" value="${proj.nombre}" required>
                </div>
                
                <div class="form-group">
                    <label>Cliente</label>
                    <select class="form-select" name="cliente_id">
                        <option value="">Sin cliente</option>
                        ${clientes.map(c => `<option value="${c.id}" ${c.id === proj.cliente_id ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="2">${proj.descripcion || ''}</textarea>
                </div>
                
                <h3 class="font-semibold mt-4 mb-2">Tareas</h3>
                <div id="tareas-container">
                    ${tareas.map((t, index) => `
                        <div class="tarea-item flex items-center gap-2 mb-2" data-index="${index}">
                            <input type="checkbox" ${t.completada ? 'checked' : ''} onchange="marcarTareaEnEdicion(this, ${index})">
                            <input type="text" class="form-input flex-1" name="tarea_${index}" value="${t.nombre}" placeholder="Nombre de la tarea">
                            <button type="button" class="btn-icon" onclick="eliminarTareaEnEdicion(${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <button type="button" class="btn btn-outline btn-sm mt-2" onclick="agregarTareaEnEdicion()">
                    <i class="fas fa-plus"></i> Agregar tarea
                </button>
                
                <input type="hidden" name="tareas_json" id="tareas_json" value='${JSON.stringify(tareas)}'>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;

    window.agregarTareaEnEdicion = function() {
        const container = document.getElementById('tareas-container');
        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'tarea-item flex items-center gap-2 mb-2';
        div.dataset.index = index;
        div.innerHTML = `
            <input type="checkbox" onchange="marcarTareaEnEdicion(this, ${index})">
            <input type="text" class="form-input flex-1" name="tarea_${index}" placeholder="Nueva tarea">
            <button type="button" class="btn-icon" onclick="eliminarTareaEnEdicion(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
        actualizarTareasJson();
    };

    window.eliminarTareaEnEdicion = function(index) {
        document.querySelector(`.tarea-item[data-index="${index}"]`).remove();
        actualizarTareasJson();
    };

    window.marcarTareaEnEdicion = function(checkbox, index) {
        actualizarTareasJson();
    };

    function actualizarTareasJson() {
        const tareas = [];
        document.querySelectorAll('.tarea-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const input = item.querySelector('input[type="text"]');
            if (input.value.trim() !== '') {
                tareas.push({
                    nombre: input.value.trim(),
                    completada: checkbox.checked
                });
            }
        });
        document.getElementById('tareas_json').value = JSON.stringify(tareas);
    }
}

async function guardarEdicionProyecto(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const tareasJson = document.getElementById('tareas_json').value;
        const tareas = JSON.parse(tareasJson);
        
        const formData = new FormData(form);
        const clienteId = formData.get('cliente_id');
        const cliente = clienteId ? DB.getById('clientes', clienteId) : null;

        const completadas = tareas.filter(t => t.completada).length;
        const progreso = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

        const actualizacion = {
            nombre: formData.get('nombre'),
            cliente_id: clienteId || '',
            cliente_nombre: cliente?.nombre || '',
            descripcion: formData.get('descripcion'),
            tareas: tareas,
            progreso: progreso
        };

        DB.update('proyectos', currentEditingId, actualizacion);
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.update('proyectos', currentEditingId, actualizacion).catch(e => console.warn(e));
        }

        closeModal();
        showToast('Proyecto actualizado', 'success');
        showPage('proyectos');

    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function eliminarProyecto(id) {
    if (eliminarProyecto.procesando) return;
    eliminarProyecto.procesando = true;

    if (confirm('¿Estás seguro de eliminar este proyecto?')) {
        DB.delete('proyectos', id);
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('proyectos', id).catch(e => console.warn(e));
        }
        showToast('Proyecto eliminado', 'info');
        showPage('proyectos');
    }
    eliminarProyecto.procesando = false;
}

// ============================================
// RENDER FIRMAS DIGITALES
// ============================================
function renderFirmas() {
    const documentos = DB.get('documentos');
    
    return `
        <div class="page-header">
            <div>
                <h1>Firma Digital</h1>
                <p>Envía documentos para firma electrónica</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevoDocumento')">
                <i class="fas fa-paper-plane"></i> Enviar para Firma
            </button>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Cliente</th>
                            <th>Fecha envío</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${documentos.map(d => `
                            <tr>
                                <td>
                                    <i class="fas fa-file-pdf text-danger mr-2"></i>
                                    ${d.titulo}
                                </td>
                                <td>${d.cliente_nombre}</td>
                                <td>${d.fecha_envio ? formatDate(d.fecha_envio) : '-'}</td>
                                <td><span class="badge badge-${d.estado === 'firmado' ? 'success' : 'warning'}">${capitalize(d.estado)}</span></td>
                                <td>
                                    <div class="acciones-botones">
                                        <button class="btn-icon" onclick="verDocumento('${d.id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${d.estado === 'pendiente' ? `
                                            <button class="btn-icon" onclick="copiarEnlaceFirma('${d.id}')" title="Copiar enlace">
                                                <i class="fas fa-link"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon" onclick="eliminarDocumento('${d.id}')" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${documentos.length === 0 ? `
                            <tr>
                                <td colspan="5" class="text-center p-4">
                                    <div class="empty-state">
                                        <i class="fas fa-file-signature"></i>
                                        <h3>No hay documentos</h3>
                                        <p>Sube documentos para que tus clientes puedan firmarlos digitalmente</p>
                                        <button class="btn btn-primary" onclick="openModal('nuevoDocumento')">
                                            <i class="fas fa-paper-plane"></i> Subir documento
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function verDocumento(id) {
    const doc = DB.getById('documentos', id);
    if (!doc) return;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-file-signature"></i> ${doc.titulo}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p><strong>Cliente:</strong> ${doc.cliente_nombre}</p>
            <p><strong>Email:</strong> ${doc.cliente_email}</p>
            <p><strong>Fecha envío:</strong> ${doc.fecha_envio ? formatDate(doc.fecha_envio) : '-'}</p>
            <p><strong>Estado:</strong> <span class="badge badge-${doc.estado === 'firmado' ? 'success' : 'warning'}">${capitalize(doc.estado)}</span></p>
            ${doc.descripcion ? `<p><strong>Descripción:</strong> ${doc.descripcion}</p>` : ''}
            ${doc.fecha_firma ? `<p><strong>Fecha firma:</strong> ${formatDate(doc.fecha_firma)}</p>` : ''}
            
            <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

function copiarEnlaceFirma(id) {
    const link = `${window.location.origin}/firma.html?id=${id}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
        showToast('Error al copiar enlace', 'error');
    });
}

function eliminarDocumento(id) {
    if (eliminarDocumento.procesando) return;
    eliminarDocumento.procesando = true;

    if (confirm('¿Estás seguro de eliminar este documento?')) {
        DB.delete('documentos', id);
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('documentos', id).catch(e => console.warn(e));
        }
        
        showToast('Documento eliminado', 'info');
        showPage('firmas');
    }
    eliminarDocumento.procesando = false;
}

// ============================================
// RENDER CLIENTES (CRM)
// ============================================
function renderClientes() {
    const clientes = DB.get('clientes');
    
    return `
        <div class="page-header">
            <div>
                <h1>CRM - Clientes</h1>
                <p>Gestión de relaciones con clientes</p>
            </div>
            <button class="btn btn-primary" onclick="openModal('nuevoCliente')">
                <i class="fas fa-user-plus"></i> Nuevo Cliente
            </button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Total Clientes</h3>
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-number">${clientes.length}</div>
                <div class="stat-detail">registrados</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3>Activos</h3>
                    <i class="fas fa-user-check text-success"></i>
                </div>
                <div class="stat-number">${clientes.filter(c => c.estado === 'activo').length}</div>
                <div class="stat-detail">clientes activos</div>
            </div>
        </div>
        
        <div class="filters">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar clientes..." id="buscarCliente" onkeyup="buscarClientes()">
            </div>
            <select class="filter-select" id="estadoFilter" onchange="filtrarClientes()">
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
            </select>
        </div>
        
        <div class="card">
            <div class="table-responsive">
                <table class="data-table" id="tablaClientes">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Contacto</th>
                            <th>Empresa</th>
                            <th>RFC</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => `
                            <tr data-id="${c.id}">
                                <td>
                                    <div class="client-info">
                                        <div class="client-avatar">${c.nombre.charAt(0)}</div>
                                        <div>
                                            <strong>${c.nombre}</strong>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div>${c.email}</div>
                                    ${c.telefono ? `<small>${c.telefono}</small>` : ''}
                                </td>
                                <td>${c.empresa || '-'}</td>
                                <td class="font-mono">${c.rfc || '-'}</td>
                                <td><span class="badge badge-${c.estado === 'activo' ? 'success' : 'default'}">${capitalize(c.estado)}</span></td>
                                <td>
                                    <div class="acciones-botones">
                                        <button class="btn-icon" onclick="verCliente('${c.id}')" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-icon" onclick="editarCliente('${c.id}')" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon" onclick="eliminarCliente('${c.id}')" title="Eliminar">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${clientes.length === 0 ? `
                            <tr>
                                <td colspan="6" class="text-center p-4">
                                    <div class="empty-state">
                                        <i class="fas fa-users"></i>
                                        <h3>No hay clientes</h3>
                                        <p>Agrega tu primer cliente</p>
                                        <button class="btn btn-primary" onclick="openModal('nuevoCliente')">
                                            <i class="fas fa-user-plus"></i> Nuevo Cliente
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filtrarClientes() {
    const estado = document.getElementById('estadoFilter')?.value || 'todos';
    const termino = document.getElementById('buscarCliente')?.value.toLowerCase() || '';
    
    const filas = document.querySelectorAll('#tablaClientes tbody tr');
    filas.forEach(fila => {
        let mostrar = true;
        
        if (estado !== 'todos') {
            const estadoCelda = fila.querySelector('.badge')?.textContent.toLowerCase() || '';
            if (!estadoCelda.includes(estado)) mostrar = false;
        }
        
        if (mostrar && termino) {
            const texto = fila.textContent.toLowerCase();
            if (!texto.includes(termino)) mostrar = false;
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
}

function buscarClientes() {
    filtrarClientes();
}

function verCliente(id) {
    const cliente = DB.getById('clientes', id);
    if (!cliente) return;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-user"></i> ${cliente.nombre}</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p><strong>Email:</strong> ${cliente.email}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono || '-'}</p>
            <p><strong>Empresa:</strong> ${cliente.empresa || '-'}</p>
            <p><strong>RFC:</strong> ${cliente.rfc || '-'}</p>
            <p><strong>Dirección:</strong> ${cliente.direccion || '-'}</p>
            <p><strong>Estado:</strong> <span class="badge badge-${cliente.estado === 'activo' ? 'success' : 'default'}">${capitalize(cliente.estado)}</span></p>
            ${cliente.notas ? `<p><strong>Notas:</strong> ${cliente.notas}</p>` : ''}
            
            <div class="flex justify-end gap-2 mt-4">
                <button class="btn btn-primary" onclick="closeModal()">Cerrar</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

function editarCliente(id) {
    const cliente = DB.getById('clientes', id);
    if (!cliente) return;
    
    currentEditingId = id;
    
    const modalContent = `
        <div class="modal-header">
            <h2><i class="fas fa-edit"></i> Editar Cliente</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="editarClienteForm" onsubmit="actualizarCliente(event)">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" class="form-input" name="nombre" value="${cliente.nombre}" required>
                </div>
                
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" class="form-input" name="email" value="${cliente.email}" required>
                </div>
                
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" class="form-input" name="telefono" value="${cliente.telefono || ''}">
                </div>
                
                <div class="form-group">
                    <label>Empresa</label>
                    <input type="text" class="form-input" name="empresa" value="${cliente.empresa || ''}">
                </div>
                
                <div class="form-group">
                    <label>RFC</label>
                    <input type="text" class="form-input" name="rfc" value="${cliente.rfc || ''}">
                </div>
                
                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" class="form-input" name="direccion" value="${cliente.direccion || ''}">
                </div>
                
                <div class="form-group">
                    <label>Estado</label>
                    <select class="form-select" name="estado">
                        <option value="activo" ${cliente.estado === 'activo' ? 'selected' : ''}>Activo</option>
                        <option value="inactivo" ${cliente.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Notas</label>
                    <textarea class="form-textarea" name="notas" rows="2">${cliente.notas || ''}</textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal show" id="activeModal" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                ${modalContent}
            </div>
        </div>
    `;
}

async function actualizarCliente(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        
        const actualizacion = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            empresa: formData.get('empresa'),
            rfc: formData.get('rfc'),
            direccion: formData.get('direccion'),
            estado: formData.get('estado'),
            notas: formData.get('notas')
        };
        
        DB.update('clientes', currentEditingId, actualizacion);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.update('clientes', currentEditingId, actualizacion).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Cliente actualizado correctamente', 'success');
        showPage('clientes');
        
    } catch (error) {
        console.error(error);
        showToast('Error al actualizar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Cambios';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function eliminarCliente(id) {
    if (eliminarCliente.procesando) return;
    eliminarCliente.procesando = true;

    if (confirm('¿Estás seguro de eliminar este cliente?')) {
        DB.delete('clientes', id);
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.delete('clientes', id).catch(e => console.warn(e));
        }
        
        showToast('Cliente eliminado', 'info');
        showPage('clientes');
    }
    eliminarCliente.procesando = false;
}

// ============================================
// PORTAL DEL CLIENTE
// ============================================
function showPortalLogin() {
    const mainContent = document.getElementById('mainContent');
    
    mainContent.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-logo">
                    <img src="images/Sicreaooo-removebg-preview.png" alt="SICREA" onerror="this.src='https://via.placeholder.com/60x60?text=S'">
                    <h2>Portal del Cliente</h2>
                    <p>Accede a tus cotizaciones, facturas y proyectos</p>
                </div>
                
                <form onsubmit="portalLogin(event)">
                    <div class="form-group">
                        <label>Correo electrónico</label>
                        <input type="email" class="form-input" id="portalEmail" placeholder="tu@email.com" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-sign-in-alt"></i> Acceder
                    </button>
                </form>
                
                <p class="text-center text-muted text-sm mt-4">
                    Ingresa el correo con el que te registraste
                </p>
            </div>
        </div>
    `;
}

function portalLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('portalEmail').value;
    const cliente = DB.get('clientes').find(c => c.email.toLowerCase() === email.toLowerCase());
    
    if (cliente) {
        currentPortalClient = cliente;
        showPortalDashboard();
    } else {
        showToast('No se encontró un cliente con ese correo', 'error');
    }
}

function showPortalDashboard() {
    const mainContent = document.getElementById('mainContent');
    
    const cotizaciones = DB.query('cotizaciones', { cliente_id: currentPortalClient.id });
    const facturas = DB.query('facturas', { cliente_id: currentPortalClient.id });
    const proyectos = DB.query('proyectos', { cliente_id: currentPortalClient.id });
    const documentos = DB.query('documentos', { cliente_id: currentPortalClient.id });
    
    mainContent.innerHTML = `
        <div class="portal-container">
            <div class="portal-header">
                <div>
                    <h1>Hola, ${currentPortalClient.nombre}</h1>
                    <p>Bienvenido a tu portal de cliente</p>
                </div>
                <button class="btn btn-outline" style="background: white; color: var(--primary);" onclick="showPortalLogin()">
                    <i class="fas fa-sign-out-alt"></i> Salir
                </button>
            </div>
            
            <div class="portal-stats">
                <div class="portal-stat">
                    <div class="portal-stat-icon">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                    <div class="portal-stat-info">
                        <h3>${cotizaciones.length}</h3>
                        <p>Cotizaciones</p>
                    </div>
                </div>
                
                <div class="portal-stat">
                    <div class="portal-stat-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="portal-stat-info">
                        <h3>${facturas.length}</h3>
                        <p>Facturas</p>
                    </div>
                </div>
                
                <div class="portal-stat">
                    <div class="portal-stat-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="portal-stat-info">
                        <h3>${proyectos.length}</h3>
                        <p>Proyectos</p>
                    </div>
                </div>
                
                <div class="portal-stat">
                    <div class="portal-stat-icon">
                        <i class="fas fa-file-signature"></i>
                    </div>
                    <div class="portal-stat-info">
                        <h3>${documentos.length}</h3>
                        <p>Documentos</p>
                    </div>
                </div>
            </div>
            
            <div class="tabs">
                <div class="tabs-list">
                    <button class="tab-trigger active" onclick="showPortalTab('cotizaciones', this)">Cotizaciones</button>
                    <button class="tab-trigger" onclick="showPortalTab('facturas', this)">Facturas</button>
                    <button class="tab-trigger" onclick="showPortalTab('proyectos', this)">Proyectos</button>
                </div>
                
                <div id="portalCotizaciones" class="tab-content active">
                    <div class="card">
                        <h3 class="mb-3">Mis Cotizaciones</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Proyecto</th>
                                    <th>Monto</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cotizaciones.map(c => `
                                    <tr>
                                        <td>${c.numero || 'COT-' + c.id.slice(-4)}</td>
                                        <td>${c.proyecto}</td>
                                        <td>${formatCurrency(c.total || 0)}</td>
                                        <td>${c.fecha_creacion ? formatDate(c.fecha_creacion) : '-'}</td>
                                        <td><span class="badge badge-${c.estado === 'aprobada' ? 'success' : c.estado === 'pendiente' ? 'warning' : 'info'}">${capitalize(c.estado)}</span></td>
                                    </tr>
                                `).join('')}
                                ${cotizaciones.length === 0 ? '<tr><td colspan="5" class="text-center p-3">No hay cotizaciones</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="portalFacturas" class="tab-content">
                    <div class="card">
                        <h3 class="mb-3">Mis Facturas</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Monto</th>
                                    <th>Emisión</th>
                                    <th>Vencimiento</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${facturas.map(f => `
                                    <tr>
                                        <td>${f.numero}</td>
                                        <td>${formatCurrency(f.monto)}</td>
                                        <td>${f.fecha_emision ? formatDate(f.fecha_emision) : '-'}</td>
                                        <td>${f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : '-'}</td>
                                        <td><span class="badge badge-${f.estado === 'pagada' ? 'success' : 'warning'}">${capitalize(f.estado)}</span></td>
                                    </tr>
                                `).join('')}
                                ${facturas.length === 0 ? '<tr><td colspan="5" class="text-center p-3">No hay facturas</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="portalProyectos" class="tab-content">
                    <div class="card">
                        <h3 class="mb-3">Mis Proyectos</h3>
                        ${proyectos.map(p => `
                            <div class="project-card mb-3">
                                <h4 class="project-title">${p.nombre}</h4>
                                <div class="project-progress">
                                    <div class="project-progress-info">
                                        <span>Progreso</span>
                                        <span>${p.progreso || 0}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${p.progreso || 0}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        ${proyectos.length === 0 ? '<p class="text-center p-3">No hay proyectos</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showPortalTab(tab, element) {
    document.querySelectorAll('.tab-trigger').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`portal${capitalize(tab)}`).classList.add('active');
}

// ============================================
// RENDER CONFIGURACIÓN
// ============================================
function renderConfiguracion() {
    const config = DB.get('config')[0] || {};
    const format = config.pdf_format || {
        show_client_email: true,
        show_client_phone: true,
        show_client_tax_id: true,
        show_valid_until: true,
        show_notes: true,
        show_terms: true,
        show_footer: true,
        quote_title: 'COTIZACIÓN',
        client_section_title: 'CLIENTE',
        items_section_title: 'DESCRIPCIÓN'
    };
    
    const conectado = supabaseConectado ? '✅ Conectado' : '❌ Desconectado';
    
    return `
        <div class="page-header">
            <h1>Configuración de Cotizaciones</h1>
        </div>
        
        <div class="card mt-4">
            <h3 class="mb-4">Sincronización con la nube</h3>
            <p class="text-muted text-sm mb-3">Estado: <strong>${conectado}</strong></p>
            
            <div class="flex gap-3">
                <button class="btn btn-primary" onclick="sincronizarTodo()">
                    <i class="fas fa-cloud-upload-alt"></i> Subir a la nube
                </button>
                
                <button class="btn btn-outline" onclick="cargarDesdeSupabase()">
                    <i class="fas fa-cloud-download-alt"></i> Cargar desde la nube
                </button>
            </div>
        </div>
        
        <div class="content-grid">
            <!-- Logo de la empresa -->
            <div class="card">
                <h3 class="mb-4">Logo de la empresa</h3>
                <p class="text-muted text-sm mb-3">Este logo aparecerá en tus cotizaciones PDF</p>
                
                <div class="flex items-center gap-4 mb-3">
                    ${config.logo_url ? `
                        <img src="${config.logo_url}" alt="Logo" style="max-height: 60px; max-width: 200px;">
                    ` : `
                        <div class="bg-muted p-3 rounded" style="width: 200px; height: 60px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-image text-muted-foreground" style="font-size: 2rem;"></i>
                        </div>
                    `}
                    <button class="btn btn-outline" onclick="document.getElementById('logoInput').click()">
                        <i class="fas fa-upload"></i> Cambiar logo
                    </button>
                    <input type="file" id="logoInput" accept="image/*" style="display: none;" onchange="subirLogo(event)">
                </div>
            </div>
            
            <!-- Información de la empresa -->
            <div class="card">
                <h3 class="mb-4">Información de la empresa</h3>
                <p class="text-muted text-sm mb-3">Esta información aparecerá en tus cotizaciones</p>
                
                <form id="configEmpresaForm" onsubmit="guardarConfiguracionEmpresa(event)">
                    <div class="form-group">
                        <label>Nombre de la empresa</label>
                        <input type="text" class="form-input" name="empresa" value="${config.empresa || 'PIARA GPE ARROYO CASTILLO'}">
                    </div>
                    
                    <div class="form-group">
                        <label>RFC</label>
                        <input type="text" class="form-input" name="rfc" value="${config.rfc || 'AOCBZ3P'}">
                    </div>
                    
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" class="form-input" name="direccion" value="${config.direccion || 'APODACA NL'}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" class="form-input" name="telefono" value="${config.telefono || '81 2886 5333'}">
                        </div>
                        
                        <div class="form-group">
                            <label>Correo electrónico</label>
                            <input type="email" class="form-input" name="email" value="${config.email || 'arroyo.piara@gmail.com'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Sitio web</label>
                        <input type="text" class="form-input" name="website" value="${config.website || 'www.empresa.com'}">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </form>
            </div>
            
            <!-- Personalización de colores y textos -->
            <div class="card">
                <h3 class="mb-4">Personalización</h3>
                <p class="text-muted text-sm mb-3">Personaliza colores y textos</p>
                
                <form id="configPersonalizacionForm" onsubmit="guardarConfiguracionPersonalizacion(event)">
                    <div class="form-group">
                        <label>Color primario</label>
                        <div class="flex items-center gap-2">
                            <input type="color" class="form-input" style="width: 60px; height: 40px; padding: 2px;" name="color_primario" value="${config.color_primario || '#15115f'}">
                            <input type="text" class="form-input" name="color_primario_text" value="${config.color_primario || '#15115f'}" placeholder="#15115f">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Texto del pie de página</label>
                        <textarea class="form-textarea" name="footer_text" rows="2">${config.footer_text || 'Gracias por su preferencia'}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Términos y condiciones</label>
                        <textarea class="form-textarea" name="terms_conditions" rows="6">${config.terms_conditions || '1. Incluye suministro de materiales, mano de obra e insumos\n2. Entrega en Sucursal Monterrey o area metropolitana. Común acuerdo con cliente\n3. Requiere Orden de compra al correo arroyo.piara@gmail.com y finiquito a la entrega.\n4. Metodo de pago: Transferencia\n5. Precios sujetos a cambios'}</textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </form>
            </div>
            
            <!-- Editor de Formato del PDF -->
            <div class="card">
                <h3 class="mb-4">Editor de Formato del PDF</h3>
                <p class="text-muted text-sm mb-3">Personaliza qué campos y secciones se muestran en el PDF</p>
                
                <form id="configPdfFormatForm" onsubmit="guardarConfiguracionPdfFormat(event)">
                    <h4 class="font-semibold mb-3">Títulos personalizados</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Título del documento</label>
                            <input type="text" class="form-input" name="quote_title" value="${format.quote_title || 'COTIZACIÓN'}">
                        </div>
                        
                        <div class="form-group">
                            <label>Sección de cliente</label>
                            <input type="text" class="form-input" name="client_section_title" value="${format.client_section_title || 'CLIENTE'}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Columna de conceptos</label>
                        <input type="text" class="form-input" name="items_section_title" value="${format.items_section_title || 'DESCRIPCIÓN'}">
                    </div>
                    
                    <h4 class="font-semibold mb-3 mt-4">Campos del cliente</h4>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Email del cliente</p>
                            <p class="text-sm text-muted">Mostrar correo electrónico</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_client_email" ${format.show_client_email ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Teléfono del cliente</p>
                            <p class="text-sm text-muted">Mostrar número telefónico</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_client_phone" ${format.show_client_phone ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">RFC del cliente</p>
                            <p class="text-sm text-muted">Mostrar identificación fiscal</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_client_tax_id" ${format.show_client_tax_id ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <h4 class="font-semibold mb-3 mt-4">Secciones del documento</h4>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Fecha de vigencia</p>
                            <p class="text-sm text-muted">Válida hasta</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_valid_until" ${format.show_valid_until ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Notas</p>
                            <p class="text-sm text-muted">Sección de notas adicionales</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_notes" ${format.show_notes ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Términos y condiciones</p>
                            <p class="text-sm text-muted">Sección legal</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_terms" ${format.show_terms ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="setting-item flex items-center justify-between p-3 border-bottom">
                        <div>
                            <p class="font-medium">Pie de página</p>
                            <p class="text-sm text-muted">Texto final del documento</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" name="show_footer" ${format.show_footer ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary mt-4">Guardar Configuración</button>
                </form>
            </div>
        </div>
    `;
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================
function subirLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Solo se permiten imágenes', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showToast('La imagen no debe exceder 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const config = DB.get('config')[0] || { id: 'config_1' };
        const logoUrl = e.target.result;
        
        DB.update('config', config.id, { logo_url: logoUrl });
        
        if (supabaseConectado && supabaseClient) {
            SupabaseDB.update('configuracion', config.id, { logo_url: logoUrl }).catch(e => console.warn(e));
        }
        
        showToast('Logo actualizado correctamente', 'success');
        setTimeout(() => showPage('config'), 1000);
    };
    reader.readAsDataURL(file);
}

function guardarConfiguracionEmpresa(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const config = DB.get('config')[0] || { id: 'config_1' };
    
    const actualizacion = {
        empresa: formData.get('empresa'),
        rfc: formData.get('rfc'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        website: formData.get('website')
    };
    
    DB.update('config', config.id, actualizacion);
    
    if (supabaseConectado && supabaseClient) {
        SupabaseDB.update('configuracion', config.id, actualizacion).catch(e => console.warn(e));
    }
    
    showToast('Configuración de empresa guardada', 'success');
}

function guardarConfiguracionPersonalizacion(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const config = DB.get('config')[0] || { id: 'config_1' };
    
    const actualizacion = {
        color_primario: formData.get('color_primario'),
        footer_text: formData.get('footer_text'),
        terms_conditions: formData.get('terms_conditions')
    };
    
    DB.update('config', config.id, actualizacion);
    
    if (supabaseConectado && supabaseClient) {
        SupabaseDB.update('configuracion', config.id, actualizacion).catch(e => console.warn(e));
    }
    
    showToast('Personalización guardada', 'success');
}

function guardarConfiguracionPdfFormat(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const config = DB.get('config')[0] || { id: 'config_1' };
    
    const pdfFormat = {
        quote_title: formData.get('quote_title'),
        client_section_title: formData.get('client_section_title'),
        items_section_title: formData.get('items_section_title'),
        show_client_email: formData.get('show_client_email') === 'on',
        show_client_phone: formData.get('show_client_phone') === 'on',
        show_client_tax_id: formData.get('show_client_tax_id') === 'on',
        show_valid_until: formData.get('show_valid_until') === 'on',
        show_notes: formData.get('show_notes') === 'on',
        show_terms: formData.get('show_terms') === 'on',
        show_footer: formData.get('show_footer') === 'on'
    };
    
    DB.update('config', config.id, { pdf_format: pdfFormat });
    
    if (supabaseConectado && supabaseClient) {
        SupabaseDB.update('configuracion', config.id, { pdf_format: pdfFormat }).catch(e => console.warn(e));
    }
    
    showToast('Formato PDF guardado', 'success');
}

function sincronizarTodo() {
    if (!supabaseConectado || !supabaseClient) {
        showToast('No hay conexión con la nube', 'error');
        return;
    }
    
    showToast('Subiendo datos a la nube...', 'info');
    
    const tablas = ['clientes', 'cotizaciones', 'facturas', 'productos', 'proyectos', 'documentos', 'configuracion'];
    
    Promise.all(tablas.map(async tabla => {
        const datos = DB.get(tabla);
        if (datos && datos.length > 0) {
            const { error } = await supabaseClient.from(tabla).upsert(datos);
            if (error) console.error(`Error subiendo ${tabla}:`, error);
        }
    })).then(() => {
        showToast('✅ Datos subidos a la nube', 'success');
    }).catch(err => {
        console.error(err);
        showToast('Error al subir datos', 'error');
    });
}

// ============================================
// MODALES DE CREACIÓN
// ============================================
function renderNuevaCotizacionModal() {
    const clientes = DB.get('clientes');
    
    return `
        <div class="modal-header">
            <h2><i class="fas fa-file-invoice-dollar"></i> Nueva Cotización</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevaCotizacionForm" onsubmit="guardarNuevaCotizacion(event)">
                <div class="form-group">
                    <label>Cliente *</label>
                    <select class="form-select" name="cliente_id" required>
                        <option value="">Seleccionar cliente</option>
                        ${clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Proyecto/Concepto *</label>
                    <input type="text" class="form-input" name="proyecto" required placeholder="Nombre del proyecto">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="3" placeholder="Descripción detallada..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Monto *</label>
                        <input type="number" class="form-input" name="monto" required placeholder="0.00" step="0.01" min="0">
                    </div>
                    
                    <div class="form-group">
                        <label>Válida hasta</label>
                        <input type="date" class="form-input" name="validez" value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Notas</label>
                    <textarea class="form-textarea" name="notas" rows="2" placeholder="Condiciones de pago, notas adicionales..."></textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Cotización</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevaCotizacion(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        const clienteId = formData.get('cliente_id');
        
        if (!clienteId) {
            showToast('Debes seleccionar un cliente', 'error');
            return;
        }
        
        const cliente = DB.getById('clientes', clienteId);
        if (!cliente) {
            showToast('Cliente no encontrado', 'error');
            return;
        }
        
        const cotizaciones = DB.get('cotizaciones');
        const proyecto = formData.get('proyecto');
        const monto = parseFloat(formData.get('monto')) || 0;
        
        const nuevaCotizacion = {
            id: 'cot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            numero: `COT-${new Date().getFullYear()}-${String(cotizaciones.length + 1).padStart(3, '0')}`,
            cliente_id: clienteId,
            cliente_nombre: cliente.nombre,
            cliente_email: cliente.email,
            cliente_telefono: cliente.telefono || '',
            cliente_rfc: cliente.rfc || '',
            proyecto: proyecto,
            descripcion: formData.get('descripcion') || '',
            total: monto,
            estado: 'pendiente',
            fecha_creacion: new Date().toISOString().split('T')[0],
            validez: formData.get('validez'),
            notas: formData.get('notas') || '',
            items: [{ descripcion: proyecto, cantidad: 1, precio: monto, total: monto }]
        };
        
        DB.add('cotizaciones', nuevaCotizacion);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('cotizaciones', nuevaCotizacion).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Cotización creada correctamente', 'success');
        showPage('cotizaciones');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Cotización';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function renderNuevaFacturaModal() {
    const cotizaciones = DB.get('cotizaciones').filter(c => c.estado === 'aprobada');
    
    if (cotizaciones.length === 0) {
        return `
            <div class="modal-header">
                <h2><i class="fas fa-receipt"></i> Subir Factura</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body text-center p-4">
                <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
                <h3>No hay cotizaciones aprobadas</h3>
                <p class="mb-4">Para crear una factura, primero debes aprobar una cotización.</p>
                <div class="flex justify-center gap-2">
                    <button class="btn btn-outline" onclick="closeModal()">Cerrar</button>
                    <button class="btn btn-primary" onclick="closeModal(); showPage('cotizaciones')">
                        Ir a cotizaciones
                    </button>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="modal-header">
            <h2><i class="fas fa-receipt"></i> Subir Factura</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevaFacturaForm" onsubmit="guardarNuevaFactura(event)">
                <div class="form-group">
                    <label>Cotización relacionada *</label>
                    <select class="form-select" name="cotizacion_id" required>
                        <option value="">Seleccionar cotización</option>
                        ${cotizaciones.map(c => `<option value="${c.id}" data-cliente="${c.cliente_nombre}" data-monto="${c.total}">${c.numero} - ${c.cliente_nombre} - ${formatCurrency(c.total)}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Número de factura *</label>
                    <input type="text" class="form-input" name="numero" required placeholder="FAC-2025-001">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha emisión</label>
                        <input type="date" class="form-input" name="fecha_emision" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label>Fecha vencimiento</label>
                        <input type="date" class="form-input" name="fecha_vencimiento" value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar Factura</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevaFactura(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        const cotizacionId = formData.get('cotizacion_id');
        const cotizacion = DB.getById('cotizaciones', cotizacionId);
        
        if (!cotizacion) {
            showToast('Debes seleccionar una cotización', 'error');
            return;
        }
        
        const facturas = DB.get('facturas');
        
        const nuevaFactura = {
            id: 'fac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            numero: formData.get('numero'),
            cotizacion_id: cotizacionId,
            cotizacion_numero: cotizacion.numero,
            cliente_id: cotizacion.cliente_id,
            cliente_nombre: cotizacion.cliente_nombre,
            monto: cotizacion.total || 0,
            fecha_emision: formData.get('fecha_emision'),
            fecha_vencimiento: formData.get('fecha_vencimiento'),
            estado: 'pendiente',
            archivo_url: null,
            notas: ''
        };
        
        DB.add('facturas', nuevaFactura);
        DB.update('cotizaciones', cotizacionId, { estado: 'facturada' });
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('facturas', nuevaFactura).catch(e => console.warn(e));
            await SupabaseDB.update('cotizaciones', cotizacionId, { estado: 'facturada' }).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Factura creada correctamente', 'success');
        showPage('facturacion');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Factura';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function renderNuevoProductoModal() {
    return `
        <div class="modal-header">
            <h2><i class="fas fa-box"></i> Nuevo Producto</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevoProductoForm" onsubmit="guardarNuevoProducto(event)">
                <div class="form-group">
                    <label>Código</label>
                    <input type="text" class="form-input" name="codigo" placeholder="PROD-001">
                </div>
                
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" class="form-input" name="nombre" required placeholder="Nombre del producto">
                </div>
                
                <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" class="form-input" name="categoria" placeholder="Ej: Químicos, Equipos...">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Precio *</label>
                        <input type="number" class="form-input" name="precio" required placeholder="0.00" step="0.01" min="0">
                    </div>
                    
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" class="form-input" name="stock" value="0" min="0">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Stock mínimo</label>
                    <input type="number" class="form-input" name="stock_minimo" value="5" min="0">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="2" placeholder="Descripción del producto"></textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Producto</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevoProducto(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        
        const nuevoProducto = {
            id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            codigo: formData.get('codigo') || `PROD-${String(DB.get('productos').length + 1).padStart(3, '0')}`,
            nombre: formData.get('nombre'),
            categoria: formData.get('categoria'),
            precio: parseFloat(formData.get('precio')) || 0,
            stock: parseInt(formData.get('stock')) || 0,
            stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
            descripcion: formData.get('descripcion'),
            unidad: 'pieza'
        };
        
        DB.add('productos', nuevoProducto);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('productos', nuevoProducto).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Producto agregado correctamente', 'success');
        showPage('inventario');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Producto';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function renderNuevoProyectoModal() {
    const clientes = DB.get('clientes');
    
    return `
        <div class="modal-header">
            <h2><i class="fas fa-tasks"></i> Nuevo Proyecto</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevoProyectoForm" onsubmit="guardarNuevoProyecto(event)">
                <div class="form-group">
                    <label>Nombre del proyecto *</label>
                    <input type="text" class="form-input" name="nombre" required placeholder="Nombre del proyecto">
                </div>
                
                <div class="form-group">
                    <label>Cliente</label>
                    <select class="form-select" name="cliente_id">
                        <option value="">Seleccionar cliente</option>
                        ${clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="2" placeholder="Descripción del proyecto"></textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Proyecto</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevoProyecto(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        const clienteId = formData.get('cliente_id');
        const cliente = clienteId ? DB.getById('clientes', clienteId) : null;
        
        const nuevoProyecto = {
            id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            nombre: formData.get('nombre'),
            cliente_id: clienteId || '',
            cliente_nombre: cliente?.nombre || '',
            descripcion: formData.get('descripcion'),
            estado: 'planificacion',
            prioridad: 'media',
            fecha_inicio: new Date().toISOString().split('T')[0],
            progreso: 0,
            tareas: []
        };
        
        DB.add('proyectos', nuevoProyecto);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('proyectos', nuevoProyecto).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Proyecto creado correctamente', 'success');
        showPage('proyectos');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Proyecto';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function renderNuevoDocumentoModal() {
    const clientes = DB.get('clientes');
    
    return `
        <div class="modal-header">
            <h2><i class="fas fa-file-signature"></i> Nuevo documento para firma</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevoDocumentoForm" onsubmit="guardarNuevoDocumento(event)">
                <div class="form-group">
                    <label>Documento *</label>
                    <div class="upload-area mb-3" onclick="document.getElementById('fileDocumento').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Haz clic para subir el documento</p>
                        <p class="small-text">PDF recomendado</p>
                    </div>
                    <input type="file" id="fileDocumento" accept=".pdf" style="display: none;">
                </div>
                
                <div class="form-group">
                    <label>Título del documento *</label>
                    <input type="text" class="form-input" name="titulo" required placeholder="Ej: Contrato de servicios">
                </div>
                
                <div class="form-group">
                    <label>Cliente *</label>
                    <select class="form-select" name="cliente_id" required>
                        <option value="">Seleccionar cliente</option>
                        ${clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.email})</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Fecha de expiración</label>
                    <input type="date" class="form-input" name="expiracion" value="${new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea class="form-textarea" name="descripcion" rows="2" placeholder="Descripción o instrucciones para el firmante"></textarea>
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear documento</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevoDocumento(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        const clienteId = formData.get('cliente_id');
        const cliente = DB.getById('clientes', clienteId);
        
        const nuevoDocumento = {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            cliente_id: clienteId,
            cliente_nombre: cliente.nombre,
            cliente_email: cliente.email,
            estado: 'pendiente',
            fecha_envio: new Date().toISOString().split('T')[0],
            expiracion: formData.get('expiracion')
        };
        
        DB.add('documentos', nuevoDocumento);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('documentos', nuevoDocumento).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Documento enviado para firma', 'success');
        showPage('firmas');
        
    } catch (error) {
        console.error(error);
        showToast('Error al guardar', 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear documento';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

function renderNuevoClienteModal() {
    return `
        <div class="modal-header">
            <h2><i class="fas fa-user-plus"></i> Nuevo Cliente</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="nuevoClienteForm" onsubmit="guardarNuevoCliente(event)">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" class="form-input" name="nombre" required placeholder="Nombre completo">
                </div>
                
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" class="form-input" name="email" required placeholder="correo@ejemplo.com">
                </div>
                
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" class="form-input" name="telefono" placeholder="55 1234 5678">
                </div>
                
                <div class="form-group">
                    <label>Empresa</label>
                    <input type="text" class="form-input" name="empresa" placeholder="Nombre de la empresa">
                </div>
                
                <div class="form-group">
                    <label>RFC</label>
                    <input type="text" class="form-input" name="rfc" placeholder="RFC">
                </div>
                
                <div class="flex justify-end gap-2 mt-4">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear Cliente</button>
                </div>
            </form>
        </div>
    `;
}

async function guardarNuevoCliente(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    if (form.dataset.procesando === 'true') return;
    form.dataset.procesando = 'true';

    const submitBtn = e.submitter || form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const formData = new FormData(form);
        
        const nuevoCliente = {
            id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            empresa: formData.get('empresa'),
            rfc: formData.get('rfc'),
            estado: 'activo',
            fecha_registro: new Date().toISOString().split('T')[0]
        };
        
        DB.add('clientes', nuevoCliente);
        
        if (supabaseConectado && supabaseClient) {
            await SupabaseDB.add('clientes', nuevoCliente).catch(e => console.warn(e));
        }
        
        closeModal();
        showToast('Cliente creado correctamente', 'success');
        showPage('clientes');
        
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showToast('Error al guardar: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Cliente';
            }
            form.dataset.procesando = 'false';
        }, 500);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema SICREA iniciando...');
    
    DB.init();
    
    initSupabase().then(conectado => {
        if (conectado) {
            console.log('🌐 Modo nube disponible');
        } else {
            console.log('📦 Usando solo almacenamiento local');
        }
    });
    
    showPage('dashboard');
    
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }

    // Inicializar menú responsive
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Cerrar menú al hacer clic en overlay
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    console.log('✅ Sistema listo!');
});