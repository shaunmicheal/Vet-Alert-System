
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

export const formatCoordinates = (latitude, longitude) => {
  if (latitude == null || longitude == null) return null
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`
}

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
