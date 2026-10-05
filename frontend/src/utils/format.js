// Display formatting helpers. These format backend data for humans - they never
// contain farm/animal/report data themselves.

export const formatDate = (isoDate) => {
  if (!isoDate) return ''
  try {
    return new Date(isoDate).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

// Coordinates are optional on a farm - only show them when both exist.
export const formatCoordinates = (latitude, longitude) => {
  if (latitude == null || longitude == null) return null
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`
}

// "Cattle · Goats · Poultry" style summary of a farm's animal mix.
export const summarizeAnimalTypes = (animals, labels) => {
  if (!animals.length) return ''
  const counts = {}
  animals.forEach((animal) => {
    counts[animal.animalType] = (counts[animal.animalType] || 0) + 1
  })
  return Object.entries(counts)
    .map(([type, count]) => `${count} ${(labels[type] || type).toLowerCase()}`)
    .join(' · ')
}