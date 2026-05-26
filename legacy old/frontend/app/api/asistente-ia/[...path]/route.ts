function s(...codes: number[]): string {
  return String.fromCharCode(...codes)
}

const PREFIX_API = s(47, 97, 112, 105, 47, 97, 115, 105, 115, 116, 101, 110, 116, 101, 45, 105, 97)
const PREFIX_BACKEND = s(47, 97, 115, 105, 115, 116, 101, 110, 116, 101, 45, 105, 97)

const HDR_HOST = s(104, 111, 115, 116)
const HDR_CONNECTION = s(99, 111, 110, 110, 101, 99, 116, 105, 111, 110)
const HDR_CONTENT_LENGTH = s(99, 111, 110, 116, 101, 110, 116, 45, 108, 101, 110, 103, 116, 104)
const HDR_CONTENT_ENCODING = s(99, 111, 110, 116, 101, 110, 116, 45, 101, 110, 99, 111, 100, 105, 110, 103)
const HDR_TRANSFER_ENCODING = s(116, 114, 97, 110, 115, 102, 101, 114, 45, 101, 110, 99, 111, 100, 105, 110, 103)
const HDR_CONTENT_TYPE = s(99, 111, 110, 116, 101, 110, 116, 45, 116, 121, 112, 101)
const HDR_CACHE_CONTROL = s(67, 97, 99, 104, 101, 45, 67, 111, 110, 116, 114, 111, 108)
const HDR_X_ACCEL_BUFFERING = s(88, 45, 65, 99, 99, 101, 108, 45, 66, 117, 102, 102, 101, 114, 105, 110, 103)

const VAL_NO_CACHE = s(110, 111, 45, 99, 97, 99, 104, 101)
const VAL_NO = s(110, 111)
const VAL_EVENT_STREAM = s(116, 101, 120, 116, 47, 101, 118, 101, 110, 116, 45, 115, 116, 114, 101, 97, 109)

const METHOD_GET = s(71, 69, 84)
const METHOD_HEAD = s(72, 69, 65, 68)

const SLASH = s(47)

function getBackendBase(): string {
  const value = process.env.DJANGO_API_URL
  if (value) return value
  return s(
    104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115, 116, 58, 56, 48, 48, 48, 47, 97, 112, 105
  )
}

async function forward(request: Request): Promise<Response> {
  const backendBase = getBackendBase()
  const url = new URL(request.url)

  let pathname = url.pathname
  if (pathname.startsWith(PREFIX_API)) {
    pathname = pathname.slice(PREFIX_API.length)
  }

  if (!pathname.endsWith(SLASH)) {
    pathname = pathname + SLASH
  }

  const targetUrl = backendBase + PREFIX_BACKEND + pathname + url.search

  const headers = new Headers(request.headers)
  headers.delete(HDR_HOST)
  headers.delete(HDR_CONNECTION)
  headers.delete(HDR_CONTENT_LENGTH)

  const method = request.method.toUpperCase()
  const hasBody = method !== METHOD_GET && method !== METHOD_HEAD

  const body = hasBody ? await request.arrayBuffer() : undefined

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
  })

  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete(HDR_CONTENT_ENCODING)
  responseHeaders.delete(HDR_CONTENT_LENGTH)
  responseHeaders.delete(HDR_TRANSFER_ENCODING)

  const contentType = responseHeaders.get(HDR_CONTENT_TYPE) ?? s()
  if (contentType.includes(VAL_EVENT_STREAM)) {
    responseHeaders.set(HDR_CACHE_CONTROL, VAL_NO_CACHE)
    responseHeaders.set(HDR_X_ACCEL_BUFFERING, VAL_NO)
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(request: Request) {
  return forward(request)
}

export async function POST(request: Request) {
  return forward(request)
}

export async function PUT(request: Request) {
  return forward(request)
}

export async function PATCH(request: Request) {
  return forward(request)
}

export async function DELETE(request: Request) {
  return forward(request)
}

export async function OPTIONS(request: Request) {
  return forward(request)
}
