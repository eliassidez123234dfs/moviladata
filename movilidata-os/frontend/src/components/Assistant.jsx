import { useState, useRef, useEffect } from 'react'
import { sendAssistant } from '../services/api'

const quickQuestions = [
  '¿Cuál es el estado actual del tráfico en Medellín?',
  '¿Dónde hay mayor riesgo de accidentes hoy?',
  '¿Qué alertas activas hay en la ciudad?',
  '¿Cuál es la ruta más segura desde El Poblado hasta Laureles?'
]

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Pregúntame sobre el estado del tráfico, accidentes, rutas o alertas en Medellín.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const chatRef = useRef(null)

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    setShowQuick(false)
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const data = await sendAssistant(text)
      setMessages((prev) => [...prev, { role: 'assistant', text: data.respuesta || 'Lo siento, no pude procesar tu solicitud.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Error al conectar con el servidor. Intenta de nuevo.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-4">
        <h2 className="text-lg font-bold" style={{ color: '#C9D1D9' }}>Asistente IA</h2>
        <p className="text-sm" style={{ color: '#8B949E' }}>Consulta datos de movilidad en lenguaje natural</p>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3`}
              style={msg.role === 'user' ? {
                backgroundColor: '#238636',
                color: '#FFFFFF'
              } : {
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                color: '#C9D1D9'
              }}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: '#58A6FF' }} />
                <span className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: '#58A6FF', animationDelay: '0.15s' }} />
                <span className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: '#58A6FF', animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {showQuick && messages.length === 1 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: '#8B949E' }}>Preguntas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button key={q} type="button" onClick={() => sendMessage(q)}
                className="text-xs rounded-lg px-3 py-2 transition-all"
                style={{ backgroundColor: '#21262D', border: '1px solid #30363D', color: '#8B949E' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#30363D'; e.currentTarget.style.color = '#C9D1D9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#21262D'; e.currentTarget.style.color = '#8B949E' }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input type="text" placeholder="Escribe tu pregunta..." value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          className="input flex-1" disabled={loading} />
        <button type="button" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
          className="btn-primary px-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
