# Sitios web

Dos sitios independientes en español. Cada carpeta contiene todos los archivos que necesita su sitio. Para revisar las páginas y los formularios localmente, sirve cada carpeta con un servidor estático.

| Sitio | Carpeta |
| --- | --- |
| Globalservices · Electricidad y automatización industrial | [`globalservices/`](globalservices/) |
| Serviteca Magallanes · Mantención automotriz | [`serviteca-magallanes/`](serviteca-magallanes/) |

El sitio de Globalservices prepara localmente un resumen del requerimiento. Falta confirmar el canal de contacto de la empresa. En el sitio de Serviteca, cada ficha preselecciona el servicio y WhatsApp abre un mensaje para que el visitante lo revise y envíe desde su cuenta.

Los datos de atención del taller se consultaron en el [sitio de Serviteca Magallanes](https://www.servitecamagallanes.cl/).

## Noticias de Globalservices

El sitio publicado consulta las fuentes RSS de The Robot Report y Robotics & Automation News mediante `/api/automation-news`. El navegador actualiza los titulares al cargar la página y cada diez minutos mientras se mantiene abierta. Si falla una fuente, se muestra el estado de la consulta y una selección guardada, cuando sigue vigente.

Para generar el Worker con sus archivos estáticos incorporados, ejecuta desde la raíz:

```sh
node globalservices/runtime/build.mjs globalservices /tmp/globalservices-worker.mjs
```

## Referencias de diseño

- Globalservices. Presentación por alcance y vías de consulta de [Siemens](https://www.siemens.com/en-us/products/industrial-lifecycle-training-services/managed-system-services/), [Schneider Electric](https://www.se.com/us/en/work/services/field-services/industrial-automation/) y [ADT](https://www.adt.com/business/video-surveillance).
- Serviteca Magallanes. Selección de prestaciones y cotización a partir del vehículo en [Norauto](https://www.norauto.fr/e/preparer-rdv-atelier.html), [Firestone](https://www.firestonecompleteautocare.com/repair/), [Jiffy Lube](https://www.jiffylube.com/auto-services) y [Kwik Fit](https://www.kwik-fit.com/servicing).

## Imágenes

Las fotos de portada y las imágenes del tablero industrial y de la cámara en faena son ilustrativas y se generaron para estos sitios. La foto de revisión del motor es de [Anna Shvets](https://www.pexels.com/photo/an-auto-mechanic-checking-the-engine-of-a-car-4315570/) y se conserva bajo la [licencia de Pexels](https://www.pexels.com/license/).
