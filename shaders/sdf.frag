precision lowp float;

float raymarchEpsilon = 0.0001;

vec3 perspectiveRayDirection(float fov)
{
    vec2 centeredCoords = gl_FragCoord.xy - resolution.xy / 2.0;
    float z = resolution.y / tan(radians(fov) / 2.0);
    return normalize(vec3(centeredCoords, -z)); //Negate z because forward in GL NDC is negative
}

mat3 lookAt(vec3 eyePos, vec3 lookAtPos, vec3 up)
{
    vec3 forward = normalize(lookAtPos - eyePos);
    vec3 side = normalize(cross(forward, up));
    vec3 correctedUp = normalize(cross(side, forward));
    return mat3(
        side,
        correctedUp,
        -forward
    );
}

mat3 rotationMatrix(float yaw, float pitch, float roll)
{
    yaw = radians(yaw);
    pitch = radians(pitch);
    roll = radians(roll);

    mat3 rX = mat3(1.0, 0, 0, 0, cos(pitch), sin(pitch), 0, -sin(pitch), cos(pitch));
    mat3 rY = mat3(cos(yaw), 0, -sin(yaw), 0, 1.0, 0, sin(yaw), 0, cos(yaw));
    mat3 rZ = mat3(cos(roll), sin(roll), 0, -sin(roll), cos(roll), 0, 0, 0, 1.0);
    return rZ * rY * rX;
}

mat4 translationMatrix(vec3 translation)
{
    mat4 m = mat4(1.0);
    m[3] = vec4(translation, 1.0);
    return m;
}

// Functions from Inigo Quilez's SDF function reference: http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
// SDF Object funcs ====================================================================================================
float sdfSphere(vec3 rayPosition, float scale)
{
    return length(rayPosition) - scale;
}

float udfBox(vec3 rayPosition, vec3 bounds)
{
    return length(max(abs(rayPosition) - bounds, 0.0));
}

float udfRoundedBox(vec3 rayPosition, vec3 bounds, float cornerRadius)
{
    return length(max(abs(rayPosition) - bounds, 0.0)) - cornerRadius;
}

float sdfBox(vec3 rayPosition, vec3 bounds)
{
    vec3 d = abs(rayPosition) - bounds;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdfTorus(vec3 rayPosition, vec2 t)
{
    vec2 q = vec2(length(rayPosition.xz) - t.x, rayPosition.y);
    return length(q) - t.y;
}

float sdfCylinder(vec3 rayPosition, vec3 bounds)
{
    return length(rayPosition.xz - bounds.xy) - bounds.z;
}

float sdfCone(vec3 rayPosition, vec2 bounds)
{
    bounds = normalize(bounds);
    float q = length(rayPosition.xy);
    return dot(bounds, vec2(q, rayPosition.z));
}

float sdfPlane(vec3 rayPosition, vec4 normal)
{
    normal = normalize(normal);
    return dot(rayPosition, normal.xyz) + normal.w;
}

float sdfHexPrism(vec3 rayPosition, vec2 dim)
{
    vec3 q = abs(rayPosition);
    return max(q.z - dim.y, max((q.x * 0.866025 + q.y*0.5), q.y) - dim.x);
}

float sdfTriangularPrism(vec3 rayPosition, vec2 dim)
{
    vec3 q = abs(rayPosition);
    return max(q.z - dim.y, max(q.x * 0.886025 + rayPosition.y * 0.5, -rayPosition.y) - dim.x*0.5);
}

float sdfCapsule(vec3 rayPosition, vec3 a, vec3 b, float r)
{
    vec3 pa = rayPosition - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
    return length(pa - ba*h) - r;
}

float sdfCappedCylinder(vec3 rayPosition, vec2 dim)
{
    vec2 d = abs(vec2(length(rayPosition.xz), rayPosition.y)) - dim;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdfCappedCone(vec3 rayPosition, vec3 c)
{
    vec2 q = vec2(length(rayPosition.xz), rayPosition.y );
    vec2 v = vec2(c.z*c.y/c.x, -c.z);
    vec2 w = v - q;
    vec2 vv = vec2(dot(v,v), v.x*v.x);
    vec2 qv = vec2(dot(v,w), v.x*w.x);
    vec2 d = max(qv,0.0)*qv/vv;
    return sqrt(dot(w,w) - max(d.x,d.y)) * sign(max(q.y*v.x-q.x*v.y,w.y));
}

float sdfEllipsoid(vec3 rayPosition, vec3 radii)
{
     return (length(rayPosition/radii) - 1.0) * min(min(radii.x, radii.y), radii.z);
}

float length2(vec3 v) { return dot(v,v); }
float udfTriangle(vec3 rayPosition, vec3 a, vec3 b, vec3 c)
{
    vec3 ba = b - a; vec3 pa = rayPosition - a;
    vec3 cb = c - b; vec3 pb = rayPosition - b;
    vec3 ac = a - c; vec3 pc = rayPosition - c;
    vec3 nor = cross( ba, ac );

    return sqrt(
    (sign(dot(cross(ba,nor),pa)) +
     sign(dot(cross(cb,nor),pb)) +
     sign(dot(cross(ac,nor),pc))<2.0)
     ?
     min( min(
     length2(ba*clamp(dot(ba,pa)/length2(ba),0.0,1.0)-pa),
     length2(cb*clamp(dot(cb,pb)/length2(cb),0.0,1.0)-pb)),
     length2(ac*clamp(dot(ac,pc)/length2(ac),0.0,1.0)-pc))
     :
     dot(nor,pa)*dot(nor,pa)/length2(nor));
}

float udfQuad(vec3 rayPosition, vec3 a, vec3 b, vec3 c, vec3 d)
{
    vec3 ba = b - a; vec3 pa = rayPosition - a;
    vec3 cb = c - b; vec3 pb = rayPosition - b;
    vec3 dc = d - c; vec3 pc = rayPosition - c;
    vec3 ad = a - d; vec3 pd = rayPosition - d;
    vec3 nor = cross( ba, ad );

    return sqrt(
    (sign(dot(cross(ba,nor),pa)) +
     sign(dot(cross(cb,nor),pb)) +
     sign(dot(cross(dc,nor),pc)) +
     sign(dot(cross(ad,nor),pd))<3.0)
     ?
     min( min( min(
     length2(ba*clamp(dot(ba,pa)/length2(ba),0.0,1.0)-pa),
     length2(cb*clamp(dot(cb,pb)/length2(cb),0.0,1.0)-pb)),
     length2(dc*clamp(dot(dc,pc)/length2(dc),0.0,1.0)-pc)),
     length2(ad*clamp(dot(ad,pd)/length2(ad),0.0,1.0)-pd))
     :
     dot(nor,pa)*dot(nor,pa)/length2(nor));
}

// =====================================================================================================================
// SDF Combination Funcs
// =====================================================================================================================

// IQ's smooth minimum - removes seams between the unioned SDFs
// k = 32 : exponential
// k = 0.1 = polynomial
// k = 8 = power
float smoothMin(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

// Adds two SDFs together
float sdfUnion(float a, float b)
{

    return smoothMin(a, b, 0.1);
}

// Subtracts the area of SDF b from the area of SDF a
float sdfSubtraction(float a, float b)
{
    return max(a, -b);
}

// Gives the area overlapped by both SDFs a and b
float sdfIntersection(float a, float b)
{
    return max(a, b);
}

// =====================================================================================================================
// SDF Transformation Funcs
// NOTE: The results of these functions should be passed as the "rayPosition" parameter to the SDF functions, with the
//       exception of the ScalePostMultiply function
// =====================================================================================================================

// Repeats the SDF starting at rayPosition p with frequency modulated by c
vec3 sdfRepeat(vec3 p, vec3 c)
{
    return mod(p, c) - 0.5 * c;
}

// Rotates and translates an SDF rayPosition by a matrix m
vec3 sdfTransform(vec3 p, mat4 m)
{
    return (m*vec4(p, 1.0)).xyz;
}

// Performs pre-multiply step to scale an SDF
vec3 sdfScalePremultiply(vec3 p, float s)
{
    return p * (1.0/s);
}

//Performs post-multiply step to scale an SDF
float sdfScalePostmultiply(float sdf, float s)
{
    return sdf * s;
}

// =====================================================================================================================
// Misc Lighting Functions
// =====================================================================================================================

float lambertDiffuse(vec3 normal, vec3 lightDir)
{
    return clamp(dot(normal, lightDir), 0.0, 1.0);
}

float blinnPhongSpecular(vec3 viewDir, vec3 normal, vec3 lightDir, float specPower)
{
    vec3 h = normalize(-normalize(viewDir) + lightDir);
    float angle = max(dot(normal, h), 0.0);
    return pow(angle, specPower);
}

