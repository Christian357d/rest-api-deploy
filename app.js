const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto')
// Validaciones con zod
const { validateMovie, validatePartialMovie } = require('./schemas/movies')
// Cors
const cors = require('cors')


const app = express()
// Middleware
app.use(express.json())
app.disable('x-powered-by')

// SOLUCION DE CORS
// USANDO EL MIDDLEWARE DE CORS --> npm install cors -E
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://movies.com',
      'https://midu.dev',
      'http://127.0.0.1:3001'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS

app.get('/', (req, res) => {
  res.json({message: 'hola mundo'})
})

// Obtener Movies
app.get('/movies', (req, res) => {
  // Tambien para solucionar los cors podemos hacer que hacepte a todos, o en lugar del *, podemosponer nuestra direccion
  // const origin =  req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin){
  //   res.header('Access-Control-Allow-Origin', origin)
  // }
  const { genre } = req.params
  if(genre){
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

// Recuperar un pelicula por ID
app.get('/movies/:id', (req, res) => { // path to regexp --> parametros de la url / Algunos regexp pueden ser: + (ejemplo: /ab+cd) esto quiere decir que puede haber mas de una b (abbbbcd), otra es ? (ab?cd) esto nos dice que puede estar o no la b, otra (/ab(cd)>e) nos dice que cd es opcional /abcde o abe
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({message: 'Movie not found'})
})

app.post('/movies', (req, res) => {

  const result = validateMovie(req.body)

  if (!result.success) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})