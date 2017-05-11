precision lowp float;

uint raycastDepth = 255;
float raycastEpsilon = 0.00001;



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
    return dot(c, vec2(q, rayPosition.z));
}

float sdfPlane(vec3 rayPosition, vec4 normal)
{
    normal = normalize(normal);
    return dot(rayPosition, n.xyz) + n.w;
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
    vec3 pa = p - a, ba = b - a;
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
     return (length(rayPosition/radii) - 1.0) * min(min(r.x, r.y), r.z);
}

float dot2(vec3 v) { return dot(v,v); }
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
     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),
     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb)),
     dot2(ac*clamp(dot(ac,pc)/dot2(ac),0.0,1.0)-pc))
     :
     dot(nor,pa)*dot(nor,pa)/dot2(nor));
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
     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),
     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb)),
     dot2(dc*clamp(dot(dc,pc)/dot2(dc),0.0,1.0)-pc)),
     dot2(ad*clamp(dot(ad,pd)/dot2(ad),0.0,1.0)-pd))
     :
     dot(nor,pa)*dot(nor,pa)/dot2(nor));
}

// =====================================================================================================================
// SDF Combination Funcs
// =====================================================================================================================

// Adds two SDFs together
float sdfUnion(float a, float b)
{
    return min(a, b);
}

// Subtracts the area of SDF b from the area of SDF a
float sdfSubtraction(float a, float b)
{
    return max(-a, b);
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
float sdfRepeat(vec3 p, vec3 c)
{
    return mod(p, c) - 0.5 * c;
}

// Rotates and translates an SDF rayPosition by a matrix m
float sdfTransform(vec3 p, mat4 m)
{
    return invert(m)*p;
}

// Performs pre-multiply step to scale an SDF
vec3 sdfScalePreMultiply(vec3 p, float s)
{
    return p * (1/s).rrr;
}

//Performs post-multiply step to scale an SDF
float sdfScalePostMultiply(float sdf, float s)
{
    return sdf * s;
}





