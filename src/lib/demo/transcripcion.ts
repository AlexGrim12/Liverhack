// Transcripción de la entrevista técnica de Mariana (formato de las notas de Meet). Es ficticia, para la demostración.
export const TRANSCRIPCION_MARIANA = `Diego Ramírez (Tech Lead): Gracias por venir, Mariana. Cuéntanos brevemente tu trayectoria.
Mariana Coronado: Gracias a ustedes. Tengo 8 años construyendo plataformas de pagos. Hoy soy tech lead en una fintech y lidero a un equipo de 4 desarrolladores. Antes estuve en banca digital, donde trabajé con APIs de pagos con tarjeta.
Karla Ibarra (Product Lead): ¿Cuál ha sido el proyecto más retador de los últimos años?
Mariana Coronado: Migrar el monolito de autorizaciones a microservicios en Node.js y TypeScript sobre AWS ECS. Diseñé la arquitectura, la dividimos por dominios y reduje 40% la latencia de autorización. El mayor reto fue migrar sin detener el negocio.
Diego Ramírez (Tech Lead): ¿Cómo evitaron los cobros duplicados durante la migración?
Mariana Coronado: Implementé idempotencia en cada endpoint de cobro y reintentos con Kafka. Además hicimos pruebas de carga antes de cada corte. Desde entonces tenemos 0 cobros duplicados en 18 meses.
Diego Ramírez (Tech Lead): Cuéntame de un incidente en producción y cómo lo resolvieron.
Mariana Coronado: Una vez una alarma nos avisó de un aumento de errores en un proveedor de pagos. Diagnostiqué la causa raíz en 20 minutos: un timeout mal configurado en el reintento. Lo corregimos, hicimos el postmortem con todo el equipo y agregamos una alarma nueva para detectarlo antes.
Karla Ibarra (Product Lead): ¿Cómo explicas decisiones técnicas a gente de negocio?
Mariana Coronado: Les traduzco todo a métricas que les importan. Por ejemplo, les expliqué que bajar el p95 de 800 a 120 milisegundos subía la conversión del checkout, y así logramos priorizar el trabajo con producto en lugar de discutirlo.
Karla Ibarra (Product Lead): Perfecto. ¿Y cómo trabajas con personas junior?
Mariana Coronado: Me gusta mentorear. Acompaño a 3 personas junior con revisiones de código y sesiones semanales; dos de ellas fueron promovidas el año pasado. Delego tareas con criterios claros y me quedo con las decisiones de arquitectura.
Diego Ramírez (Tech Lead): ¿Con qué base de datos trabajas y cómo la optimizas?
Mariana Coronado: Principalmente PostgreSQL con Redis para caché. Optimicé consultas con índices y particionamiento; bajamos el tiempo de respuesta de una consulta crítica de 800 a 120 milisegundos.
Diego Ramírez (Tech Lead): ¿Cómo manejas la seguridad y el cumplimiento en pagos?
Mariana Coronado: Trabajamos bajo PCI DSS. Uso OAuth2 y JWT para los servicios, cifrado de datos sensibles y revisiones de seguridad en cada release.
Karla Ibarra (Product Lead): ¿Qué áreas sientes más débiles hoy?
Mariana Coronado: Todavía estoy aprendiendo Kubernetes; en ECS me siento muy cómoda, pero en Kubernetes tengo menos experiencia. Tampoco he trabajado con GraphQL federado ni con Rust. Me gustaría aprender ambos, ya tomé un curso de Kubernetes y estoy preparando la certificación.
Diego Ramírez (Tech Lead): ¿Cómo te mantienes actualizada?
Mariana Coronado: Leo mucho, contribuyo a proyectos open source y organizo una comunidad de mentoría para mujeres en tecnología.
Karla Ibarra (Product Lead): ¿Estás disponible para guardias?
Mariana Coronado: Sí, en mi equipo rotamos guardias de soporte y no tengo problema.
Diego Ramírez (Tech Lead): ¿Qué preguntas tienes para nosotros?
Mariana Coronado: ¿Cómo se toman las decisiones de arquitectura en el equipo de pagos y qué tanto autonomía tendría para proponer cambios?
Karla Ibarra (Product Lead): Mucha; trabajamos con propuestas por escrito y revisiones abiertas. Muchas gracias, Mariana.`;

// Ronda 1: screening de Reclutamiento (RH) con Mariana. Ficticia, para la demostración.
export const TRANSCRIPCION_SCREENING_MARIANA = `Sofía Martínez (Reclutamiento): Hola Mariana, gracias por tu tiempo. Cuéntame qué te llamó la atención de esta posición.
Mariana Coronado: Me interesa el reto de pagos a la escala de Liverpool. Llevo 8 años en pagos y quiero un equipo donde pueda diseñar la arquitectura y no solo implementar.
Sofía Martínez (Reclutamiento): ¿Cuál es tu situación actual y cuándo podrías incorporarte?
Mariana Coronado: Hoy soy tech lead en una fintech. Mi aviso es de 30 días, así que podría incorporarme en un mes.
Sofía Martínez (Reclutamiento): ¿Qué pretensión económica tienes?
Mariana Coronado: Actualmente gano 55 mil pesos mensuales y busco 68 mil. Soy flexible si el paquete de prestaciones lo compensa.
Sofía Martínez (Reclutamiento): La posición es híbrida en Ciudad de México, tres días en oficina. ¿Te funciona?
Mariana Coronado: Sí, vivo en la Ciudad de México y el esquema híbrido me funciona bien.
Sofía Martínez (Reclutamiento): ¿Qué nivel de inglés tienes? Trabajarías con un equipo global.
Mariana Coronado: Inglés avanzado, uso el idioma a diario en reuniones y documentación.
Sofía Martínez (Reclutamiento): El equipo tiene guardias de soporte rotativas, ¿cómo lo ves?
Mariana Coronado: Ya las hago hoy y me parece justo con una buena compensación. También mentoro a mujeres que inician en tecnología y me gustaría seguir haciéndolo.
Sofía Martínez (Reclutamiento): Perfecto, avanzo tu perfil a la entrevista técnica con Diego y Karla.`;
