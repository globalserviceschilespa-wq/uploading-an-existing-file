const form = document.querySelector('#request-form')
const vehicle = document.querySelector('#vehicle')
const mileage = document.querySelector('#mileage')
const service = document.querySelector('#service')
const notes = document.querySelector('#notes')
const result = document.querySelector('#request-result')
const resultTitle = document.querySelector('#result-title')
const message = document.querySelector('#message')
const status = document.querySelector('#result-status')
const whatsapp = document.querySelector('#whatsapp-link')
const numberFormat = new Intl.NumberFormat('es-CL')

for (const link of document.querySelectorAll('[data-service]')) {
  link.addEventListener('click', () => {
    service.value = link.dataset.service
    result.hidden = true
  })
}

vehicle.addEventListener('input', () => vehicle.setCustomValidity(''))

form.addEventListener('input', () => {
  result.hidden = true
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const vehicleName = vehicle.value.trim()
  if (!vehicleName) {
    vehicle.setCustomValidity('Escribe la marca y el modelo de tu auto.')
    vehicle.reportValidity()
    return
  }

  const lines = [
    'Hola, Serviteca Magallanes. Quisiera consultar por mi vehículo.',
    '',
    'Vehículo · ' + vehicleName,
    'Motivo · ' + service.selectedOptions[0].textContent,
  ]
  if (mileage.value !== '') {
    lines.push('Kilometraje · ' + numberFormat.format(mileage.valueAsNumber) + ' km')
  }
  if (notes.value.trim()) {
    lines.push('Detalles · ' + notes.value.trim())
  }
  lines.push('', '¿Podrían indicarme si pueden realizar la revisión? Gracias.')

  message.value = lines.join('\n')
  whatsapp.href = 'https://wa.me/56961412094?text=' + encodeURIComponent(message.value)
  status.textContent = ''
  result.hidden = false
  resultTitle.focus()
})

document.querySelector('#copy-button').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(message.value)
    status.textContent = 'Mensaje copiado.'
  } catch {
    message.focus()
    message.select()
    status.textContent = 'El texto está seleccionado. Puedes copiarlo con el menú de tu dispositivo.'
  }
})

form.hidden = false
