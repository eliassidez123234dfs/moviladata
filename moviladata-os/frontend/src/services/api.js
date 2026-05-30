// helper for API calls - unused for now but provided for extension
export async function getJSON(path){
  const res = await fetch(path)
  if(!res.ok) throw new Error('API error')
  return res.json()
}
