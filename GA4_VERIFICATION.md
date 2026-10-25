# ANA-02: comprobar los cinco eventos en GA4

Esta es una comprobación operativa, no una nueva medición de rendimiento. La producción de contenido permanece en pausa. La recepción en GA4 debe confirmarse dentro de la propiedad; una compilación correcta o una petición de red no bastan para cerrar ANA-02.

## 1. Localizar la propiedad correcta

1. Abre [Google Analytics](https://analytics.google.com/) con la cuenta de Google utilizada para configurar Earnometry.
2. Abre el selector de cuentas y propiedades de la parte superior y busca **Earnometry**. Si no aparece, comprueba la cuenta de Google del avatar; no crees una propiedad nueva para sustituir la existente.
3. En **Administración → Recogida y modificación de datos → Flujos de datos**, abre el flujo web de `earnometry.com`.
4. Confirma el ID de medición **G-4X5MF3R8PS**. El nombre visible de la propiedad puede variar; el ID del flujo identifica el destino que usa la web.

Referencias: [selector de propiedades](https://support.google.com/analytics/answer/10253796?hl=es) y [localizar el ID de medición](https://support.google.com/analytics/answer/12270356?hl=es).

## 2. Preparar una prueba identificable

Abre **Informes → Tiempo real** en GA4. En otra pestaña, abre [la prueba de Earnometry](https://earnometry.com/?utm_source=qa&utm_medium=validation&utm_campaign=ana02_manual_check), acepta **Accept analytics** y espera a que termine de cargar la página. Si usas un bloqueador de analítica, desactívalo solo para esta prueba.

Anota la hora y la zona horaria de inicio. La campaña `ana02_manual_check` identifica la visita de comprobación; no la uses como evidencia de adquisición orgánica o conversión comercial. No añadas UTMs a los enlaces internos de la web.

## 3. Generar los cinco eventos

Realiza las acciones en este orden y sin recargar la página de la calculadora entre los pasos 2 y 4:

| Paso | Acción en Earnometry | Evento esperado | Parámetros que comprobar |
| --- | --- | --- | --- |
| 1 | En la portada, pulsa **Estimate your YouTube earnings** | `internal_cta_clicked` | `cta_id=home_youtube_hero`, `placement=home_hero`, `destination_path=/tools/youtube-money-calculator` |
| 2 | En la calculadora, introduce `100000` en **Monthly long-form views** | `calculator_started` | `calculator_id=youtube_money` |
| 3 | Introduce `3` en **Long-form RPM**; el resultado debe ser **$300.00** al mes | `calculator_result_generated` | `calculator_id=youtube_money` |
| 4 | Introduce `1000` en **Monthly income target**; la alternativa long-form debe mostrar **333,334** vistas | `income_target_used` | `calculator_id=youtube_money` |
| 5 | Al final de la metodología, pulsa **Creator Sponsorship Rate Calculator** | `related_tool_clicked` | `calculator_id=youtube_money`, `destination_calculator_id=sponsorship_rate`, `cta_id=youtube_related_sponsorship` |

En todos los eventos personalizados debe aparecer `event_version=1` y `page_path` sin parámetros ni fragmento. Los eventos de calculadora deben indicar `/tools/youtube-money-calculator`; el clic de la portada debe indicar `/`. No deben enviarse los valores `100000`, `3`, `1000`, el resultado monetario ni datos personales como parámetros personalizados.

Como segunda comprobación, cambia las vistas predeterminadas de la calculadora de patrocinios de `50000` a `60000`. Debe mostrar **$1,500** y emitir `calculator_started` y `calculator_result_generated` con `calculator_id=sponsorship_rate`. El ejemplo predeterminado por sí solo no debe generar uso.

## 4. Confirmar la recepción

En **Tiempo real**, busca la tarjeta de número/recuento de eventos por nombre del evento. Selecciona cada uno de los cinco nombres para inspeccionar los parámetros recibidos. La tarjeta agrega actividad de los últimos 30 minutos: el recuento global puede incluir visitas anteriores, por lo que no tiene que ser exactamente uno. [Ayuda oficial sobre recepción en tiempo real](https://support.google.com/analytics/answer/9322688?hl=es).

Para esta comprobación inicial no hace falta crear eventos personalizados en la interfaz ni registrar dimensiones. Las dimensiones personalizadas sirven después para los informes; su disponibilidad puede tardar 24-48 horas. [Dimensiones de ámbito de evento](https://support.google.com/analytics/answer/14239696?hl=es).

Si necesitas aislar tu dispositivo y ver la secuencia con más detalle:

1. Abre [Google Tag Assistant](https://tagassistant.google.com/), conecta `https://earnometry.com/` y utiliza la ventana de prueba que abra.
2. Acepta la analítica en esa ventana y repite la tabla de acciones.
3. En GA4, ve a **Administración → Visualización de datos → DebugView** y selecciona tu dispositivo de depuración.
4. Selecciona los eventos y revisa sus parámetros. Tag Assistant activa la depuración para la prueba; no cambies la configuración pública para activar debug en todos los visitantes. [Ayuda oficial de DebugView](https://support.google.com/analytics/answer/7201382?hl=es).

## 5. Criterio para cerrar ANA-02

Registra la hora de prueba, el flujo comprobado, los cinco nombres recibidos y sus parámetros relevantes. También comprueba que editar varias veces una calculadora no repite sus eventos de inicio/primer resultado en ese mismo documento. Recargar o navegar de nuevo crea otro documento y permite nuevos recuentos.

Si falta un evento, anota cuál, en qué paso y si aparece o no en DebugView. Revisa el flujo correcto, el consentimiento y el bloqueador antes de cambiar la implementación. No marques ANA-02 como completado solo porque la web esté publicada. La producción de contenido sigue en pausa durante esta verificación, AUTO-02 y DISC-01.
