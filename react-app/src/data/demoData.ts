import { diaIso } from '../lib/dates'
import { COLECCION } from './mappers'
import { MemoryBackend } from './memoryBackend'

/** Datos de ejemplo para el modo demo, siempre relativos a la fecha de hoy. */
export function crearBackendDemo(hoy: Date = new Date()): MemoryBackend {
  const b = new MemoryBackend()
  const dia = (delta: number) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + delta)
  const mes = (delta: number) => new Date(hoy.getFullYear(), hoy.getMonth() + delta, 1)
  const claveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const hace = (minutos: number) => new Date(hoy.getTime() - minutos * 60_000)

  b.sembrar(COLECCION.colaboraciones, [
    {
      id: 'c1',
      data: { nombreCliente: 'Bar Pepe', instagramCliente: 'barpepe', descripcion: 'Reel de la terraza + stories del finde', estado: 'pagada', precio: 120000, fecha: dia(3), notasCliente: 'Quieren mostrar el vermut de la casa', reelId: null },
    },
    {
      id: 'c2',
      data: { nombreCliente: 'Hotel Mirador', instagramCliente: 'hotelmiradorsur', descripcion: 'Tour de habitaciones y spa para temporada alta', estado: 'publicada', precio: 250000, fecha: dia(-6), notasCliente: '', reelId: 'r2' },
    },
    {
      id: 'c3',
      data: { nombreCliente: 'Restaurante La Brasa', instagramCliente: 'tapasybrasa', descripcion: 'Cocina abierta: 3 reels de platos estrella', estado: 'confirmada', precio: 180000, fecha: dia(9), notasCliente: 'Coordinar con el chef, martes a la tarde', reelId: null },
    },
    {
      id: 'c4',
      data: { nombreCliente: 'Estética Aura', instagramCliente: 'clinica.aura', descripcion: 'Promo de verano: antes y después', estado: 'confirmada', precio: 90000, fecha: null, notasCliente: '', reelId: null },
    },
    {
      id: 'c5',
      data: { nombreCliente: 'Beach Club Marea', instagramCliente: 'beachclubmarea', descripcion: 'Aftermovie de la fiesta de apertura', estado: 'pagada', precio: 300000, fecha: dia(15), notasCliente: 'Incluye drone', reelId: null },
    },
    {
      id: 'c6',
      data: { nombreCliente: 'Barbería Don Nico', instagramCliente: 'barbershop.nico', descripcion: 'Reel de transformación + reseñas NFC', estado: 'confirmada', precio: 60000, fecha: dia(1), notasCliente: '', reelId: null },
    },
  ])

  b.sembrar(COLECCION.reels, [
    { id: 'r1', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0001/', descripcion: 'NFC de reseñas de Google en mesa: cómo funciona', categoria: 'ejemplo', colaboracionId: null } },
    { id: 'r2', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0002/', descripcion: 'Tour del Hotel Mirador: spa y vistas', categoria: 'colaboracion', colaboracionId: 'c2' } },
    { id: 'r3', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0003/', descripcion: 'Cocina abierta: el plato estrella de La Brasa', categoria: 'colaboracion', colaboracionId: 'c3' } },
    { id: 'r4', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0004/', descripcion: 'Antes y después en barbería', categoria: 'ejemplo', colaboracionId: null } },
    { id: 'r5', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0005/', descripcion: 'Pack carta en mesa: pedido sin esperar', categoria: 'ejemplo', colaboracionId: null } },
    { id: 'r6', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0006/', descripcion: 'Promo de verano en Estética Aura', categoria: 'colaboracion', colaboracionId: 'c4' } },
    { id: 'r7', data: { urlInstagram: 'https://www.instagram.com/reel/DEMO0007/', descripcion: 'Aftermovie de beach club con drone', categoria: 'ejemplo', colaboracionId: null } },
  ])

  b.sembrar(COLECCION.abonos, [
    {
      id: 'a1',
      data: {
        nombreCliente: 'Restaurante La Brasa',
        instagramCliente: 'tapasybrasa',
        descripcion: '12 videos al mes + gestión de redes',
        montoMensual: 150000,
        diaCobro: 5,
        desde: mes(-3),
        activo: true,
        mesesPagados: [claveMes(mes(-3)), claveMes(mes(-2))],
      },
    },
    {
      id: 'a2',
      data: {
        nombreCliente: 'Hotel Mirador',
        instagramCliente: 'hotelmiradorsur',
        descripcion: '8 videos + 20 stories al mes',
        montoMensual: 280000,
        diaCobro: 1,
        desde: mes(-4),
        activo: true,
        mesesPagados: [mes(-4), mes(-3), mes(-2), mes(-1), mes(0)].map(claveMes),
      },
    },
    {
      id: 'a3',
      data: {
        nombreCliente: 'Estética Aura',
        instagramCliente: 'clinica.aura',
        descripcion: 'Contenido semanal',
        montoMensual: 90000,
        diaCobro: 10,
        desde: mes(-2),
        activo: true,
        mesesPagados: [claveMes(mes(-2)), claveMes(mes(-1))],
      },
    },
    {
      id: 'a4',
      data: { nombreCliente: 'Gimnasio Fuerza', instagramCliente: 'gym.fuerza', descripcion: 'Pausado hasta marzo', montoMensual: 70000, diaCobro: 15, desde: mes(-6), activo: false, mesesPagados: [claveMes(mes(-6)), claveMes(mes(-5))] },
    },
  ])

  // Las reglas automáticas generan sus tareas solas al abrir la app (lo corre App).
  // Para que el recordatorio se vea hoy, se suma el día de la semana actual.
  const diasAviso = [...new Set([1, 3, 5, diaIso(hoy)])].sort((x, y) => x - y)
  b.sembrar(COLECCION.reglas, [
    {
      id: 'g1',
      data: {
        titulo: 'Video para Bar Pepe',
        cantidad: 3,
        frecuencia: 'semanal',
        diaLimite: 7,
        cliente: 'Bar Pepe',
        descripcion: 'Un video por visita: terraza, barra y platos',
        agregarAlCalendario: true,
        activa: true,
        desde: dia(-1),
        generadaHasta: null,
        diasRecordatorio: diasAviso,
      },
    },
    {
      id: 'g2',
      data: {
        titulo: 'Fotos de platos',
        cantidad: 1,
        frecuencia: 'semanal',
        diaLimite: 5,
        cliente: 'Restaurante La Brasa',
        descripcion: '',
        agregarAlCalendario: false,
        activa: true,
        desde: dia(-1),
        generadaHasta: null,
        diasRecordatorio: [5],
      },
    },
    {
      id: 'g3',
      data: {
        titulo: 'Informe mensual de resultados',
        cantidad: 1,
        frecuencia: 'mensual',
        diaLimite: 28,
        cliente: 'Hotel Mirador',
        descripcion: 'Alcance, visitas al perfil y reservas',
        agregarAlCalendario: true,
        activa: true,
        desde: dia(-1),
        generadaHasta: null,
        diasRecordatorio: [],
      },
    },
  ])

  b.sembrar(COLECCION.tareas, [
    { id: 't1', data: { titulo: 'Pasar presupuesto a Beach Club Marea', descripcion: 'Incluye drone y 2 días de edición', cliente: 'Beach Club Marea', fechaLimite: dia(2), hecha: false, agregarAlCalendario: true, reglaId: null, creadaEn: hace(900) } },
    { id: 't2', data: { titulo: 'Editar reel del Hotel Mirador', descripcion: '', cliente: 'Hotel Mirador', fechaLimite: dia(0), hecha: false, agregarAlCalendario: false, reglaId: null, creadaEn: hace(1500) } },
    { id: 't3', data: { titulo: 'Responder consultas de la web', descripcion: 'Hay 3 nuevas esperando', cliente: '', fechaLimite: dia(-1), hecha: false, agregarAlCalendario: false, reglaId: null, creadaEn: hace(2500) } },
    { id: 't4', data: { titulo: 'Grabar pack carta en mesa', descripcion: '', cliente: 'Barbería Don Nico', fechaLimite: null, hecha: false, agregarAlCalendario: false, reglaId: null, creadaEn: hace(4000) } },
    { id: 't5', data: { titulo: 'Subir stories de la semana', descripcion: '', cliente: 'Estética Aura', fechaLimite: dia(-3), hecha: true, agregarAlCalendario: false, reglaId: null, creadaEn: hace(6000) } },
    { id: 't6', data: { titulo: 'Facturar a Hotel Mirador', descripcion: '', cliente: 'Hotel Mirador', fechaLimite: dia(-2), hecha: true, agregarAlCalendario: false, reglaId: null, creadaEn: hace(7000) } },
  ])

  b.sembrar(COLECCION.eventos, [
    { id: 'colaboracion-c1', data: { titulo: 'Bar Pepe', descripcion: 'Reel de la terraza + stories del finde', fecha: dia(3), colaboracionId: 'c1' } },
    { id: 'colaboracion-c3', data: { titulo: 'Restaurante La Brasa', descripcion: 'Cocina abierta: 3 reels de platos estrella', fecha: dia(9), colaboracionId: 'c3' } },
    { id: 'colaboracion-c5', data: { titulo: 'Beach Club Marea', descripcion: 'Aftermovie de la fiesta de apertura', fecha: dia(15), colaboracionId: 'c5' } },
    { id: 'colaboracion-c6', data: { titulo: 'Barbería Don Nico', descripcion: 'Reel de transformación + reseñas NFC', fecha: dia(1), colaboracionId: 'c6' } },
    { id: 'tarea-t1', data: { titulo: 'Tarea: Pasar presupuesto a Beach Club Marea', descripcion: 'Beach Club Marea · Incluye drone y 2 días de edición', fecha: dia(2), colaboracionId: null } },
    { id: 'e1', data: { titulo: 'Reunión de equipo', descripcion: 'Repasar el mes y planificar el siguiente', fecha: dia(2), colaboracionId: null } },
    { id: 'e2', data: { titulo: 'Entrega de reels a Hotel Mirador', descripcion: '', fecha: dia(5), colaboracionId: 'c2' } },
    { id: 'e3', data: { titulo: 'Capacitación de redes', descripcion: 'Webinar de Meta', fecha: dia(11), colaboracionId: null } },
  ])

  b.sembrar(COLECCION.propuestas, [
    { id: 'p1', data: { titulo: 'Restaurante', mensaje: '¡Hola! Somos AceMedia Marketing 👋 Ayudamos a restaurantes a conseguir más reseñas en Google y más reservas con videos cortos. ¿Te cuento cómo funciona nuestro pack de reseñas con NFC en mesa?' } },
    { id: 'p2', data: { titulo: 'Hotel', mensaje: '¡Hola! Te escribimos de AceMedia Marketing. Creamos reels que muestran lo mejor de tu hotel y atraen reservas directas. ¿Querés ver un ejemplo de un tour que hicimos?' } },
    { id: 'p3', data: { titulo: 'Bar', mensaje: '¡Hola! Somos AceMedia Marketing 🍸 Hacemos videos para bares que llenan el local los fines de semana. ¿Te mando ideas para tu terraza?' } },
    { id: 'p4', data: { titulo: 'Estética', mensaje: '¡Hola! En AceMedia Marketing hacemos contenido de antes y después que genera turnos. ¿Querés que te mostremos cómo quedaría para tu centro?' } },
    { id: 'p5', data: { titulo: 'Gimnasio', mensaje: '¡Hola! Somos AceMedia Marketing 💪 Creamos videos de transformaciones y clases que traen nuevos socios. ¿Hablamos?' } },
  ])

  b.sembrar(COLECCION.cuentas, [
    { id: 'i1', data: { usuario: 'cafeterialuna', notas: 'Café de especialidad, 12k seguidores', vista: false, propuestaId: 'p1' } },
    { id: 'i2', data: { usuario: 'pizzeria_napoli', notas: 'Tienen 3 sucursales', vista: false, propuestaId: 'p1' } },
    { id: 'i3', data: { usuario: 'barbershop.nico', notas: '', vista: true, propuestaId: 'p3' } },
    { id: 'i4', data: { usuario: 'clinica.aura', notas: 'Contactar a Marina', vista: true, propuestaId: 'p4' } },
    { id: 'i5', data: { usuario: 'hotelmiradorsur', notas: 'Ya son clientes', vista: true, propuestaId: 'p2' } },
    { id: 'i6', data: { usuario: 'gym.fuerza', notas: '', vista: false, propuestaId: 'p5' } },
    { id: 'i7', data: { usuario: 'heladeria_dulce', notas: 'Temporada de verano', vista: false, propuestaId: null } },
    { id: 'i8', data: { usuario: 'floresteria.rosa', notas: '', vista: false, propuestaId: null } },
  ])

  b.sembrar(COLECCION.notas, [
    { id: 'n1', data: { titulo: 'Ideas de reels', contenido: 'Cocina abierta con cámara lenta\nReseñas con NFC en la mesa\nAntes y después de la barbería\nTour nocturno del hotel con luces cálidas\nDetrás de escena de una producción', actualizadaEn: hace(60) } },
    { id: 'n2', data: { titulo: '', contenido: 'Llamar a Marina de Estética Aura el jueves.', actualizadaEn: hace(200) } },
    { id: 'n3', data: { titulo: 'Checklist de grabación', contenido: 'Batería cargada\nTarjeta de memoria libre\nLuz de relleno\nMicrófono de solapa\nTrípode\nPermiso del local para grabar clientes\nLista de planos acordada con el cliente\nRevisar que el local esté limpio y ordenado', actualizadaEn: hace(900) } },
    { id: 'n4', data: { titulo: 'Contraseña del wifi del estudio', contenido: 'La pegaron en el monitor, no hace falta anotarla acá.', actualizadaEn: hace(3000) } },
    { id: 'n5', data: { titulo: 'Tarifas 2026', contenido: 'Reel suelto: $ 60.000\nPack de 3 reels: $ 160.000\nAbono mensual básico: $ 90.000\nAbono completo con gestión de redes: $ 280.000\nSesión con drone: + $ 40.000', actualizadaEn: hace(5200) } },
    { id: 'n6', data: { titulo: 'Para recordar', contenido: 'Pedir permisos de música antes de publicar.', actualizadaEn: hace(8000) } },
    { id: 'n7', data: { titulo: 'Plan de contenidos de noviembre', contenido: 'Semana 1: lanzamiento de la promo de verano\nSemana 2: casos de éxito de clientes (Hotel Mirador y Bar Pepe)\nSemana 3: detrás de cámaras y equipo\nSemana 4: cierre de mes con resultados y agradecimientos\n\nIdeas extra: sorteo en conjunto con un cliente, serie de tips para negocios locales, entrevista corta al chef de La Brasa.', actualizadaEn: hace(12000) } },
  ])

  b.sembrar(COLECCION.consultas, [
    { id: 'q1', data: { nombre: 'Lucía Fernández', negocio: 'Cafetería Luna', sector: 'Restaurante', intereses: ['NFC Reseñas Google (Pack 3)', 'Gestión de Redes'], contacto: '611 22 33 44', mensaje: 'Hola, queremos más reseñas en Google y mejorar Instagram. ¿Cuánto costaría?', idioma: 'es', estado: 'nueva', creadaEn: hace(35) } },
    { id: 'q2', data: { nombre: 'James Carter', negocio: 'Marina Bay Hotel', sector: 'Hotel', intereses: ['Colaboración'], contacto: 'james@marinabay.com', mensaje: 'We would like a promo video for our summer season.', idioma: 'en', estado: 'nueva', creadaEn: hace(300) } },
    { id: 'q3', data: { nombre: 'Marta Ruiz', negocio: '', sector: 'Estética', intereses: ['Pack Carta en Mesa', 'Web a medida'], contacto: 'marta.ruiz@correo.es', mensaje: '', idioma: 'es', estado: 'nueva', creadaEn: hace(1500) } },
    { id: 'q4', data: { nombre: 'Pablo Gómez', negocio: 'Taberna Gómez', sector: 'Bar', intereses: ['Combo Explosión'], contacto: '655 44 33 22', mensaje: 'Me interesa el combo, ¿tenéis disponibilidad en noviembre?', idioma: 'es', estado: 'respondida', creadaEn: hace(4000) } },
    { id: 'q5', data: { nombre: 'Promo SEO', negocio: '', sector: 'Otro', intereses: [], contacto: 'ventas@spam.xyz', mensaje: 'Posicionamiento web garantizado!!!', idioma: 'es', estado: 'descartada', creadaEn: hace(9000) } },
  ])

  return b
}
