export const VERTEX_SHADER = `
uniform float uTime;
uniform vec3 uMouse;
varying vec2 vUv;
varying float vDist;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    float noiseVal = snoise(vec2(worldPosition.x * 0.1, uTime * 0.2));

    float distToMouse = distance(worldPosition.xy, uMouse.xy);
    vDist = distToMouse;

    float influence = smoothstep(6.0, 0.0, distToMouse);

    vec3 toMouse = vec3(uMouse.xy, 0.0) - worldPosition.xyz;
    float toMouseLen = length(toMouse);
    vec3 directionToMouse = toMouseLen > 0.01 ? toMouse / toMouseLen : vec3(0.0);
    pos += directionToMouse * influence * 1.5;

    pos.z += sin(uTime * 1.5 + worldPosition.x * 0.5) * 0.2;

    pos.x += noiseVal * influence * 2.0;
    pos.y += noiseVal * influence * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

export const FRAGMENT_SHADER = `
uniform vec3 uColor;
uniform vec3 uGlowColor;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDist;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - abs(dot(normal, viewDir));
    rim = pow(rim, 2.0);

    vec3 finalColor = mix(uColor, uGlowColor, rim * 0.8);

    float mouseGlow = smoothstep(6.0, 0.0, vDist);
    finalColor += uGlowColor * mouseGlow * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
