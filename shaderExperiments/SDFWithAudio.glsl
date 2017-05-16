
//You may change these to your liking
const int maxRaymarchSteps = 256;
const float minRaymarchDepth = 0.0;
const float maxRaymarchDepth = 1000.0;

// Sphere surface displacement
float sphereDisplacement(vec3 pos) {
    return sin(2.5*pos.x) * sin(2.5*pos.y) * sin(2.5*pos.z);
}

// Scene function based on https://www.shadertoy.com/view/4tcGDr
float scene(vec3 currentRayPosition) {
    vec3 pos = rotationMatrix(time*5.0, 0.0, 0.0) * currentRayPosition;

    float cylinderRadius = 0.1 + (0.6) * bands.x / 2.0;
    vec2 cylinderBounds = vec2(cylinderRadius, 2.0);
    float cylinder1 = sdfCappedCylinder(pos, cylinderBounds);
    float cylinder2 = sdfCappedCylinder(rotationMatrix(0.0, 90.0, 0.0) * pos, cylinderBounds);
    float cylinder3 = sdfCappedCylinder(rotationMatrix(0.0, 0.0, 90.0) * pos, cylinderBounds);

    float cube = sdfBox(pos, vec3(0.8));

    float sphere = sdfSphere(pos, 1.2 * (0.2+(bands.z)/2.0));

    vec3 ballOffset = vec3(0.5 + bands.y, 0.0, 0.0);
    float ballRadius = 0.3;
    float balls = sdfSphere(pos - ballOffset, ballRadius) + sphereDisplacement(pos);
    balls = sdfUnion(balls, sdfSphere(pos + ballOffset, ballRadius) + sphereDisplacement(pos));
    balls = sdfUnion(balls, sdfSphere(pos - ballOffset.yxz, ballRadius) + sphereDisplacement(pos));
    balls = sdfUnion(balls, sdfSphere(pos + ballOffset.yxz, ballRadius) + sphereDisplacement(pos));
    balls = sdfUnion(balls, sdfSphere(pos - ballOffset.yzx, ballRadius) + sphereDisplacement(pos));
    balls = sdfUnion(balls, sdfSphere(pos + ballOffset.yzx, ballRadius) + sphereDisplacement(pos));

    float csgNut = sdfSubtraction(sdfIntersection(cube, sphere),
                         sdfUnion(cylinder1, sdfUnion(cylinder2, cylinder3)));

    return sdfUnion(balls, csgNut);
}

float raymarchSDF(vec3 rayOrigin, vec3 rayDir) {
    float depth = minRaymarchDepth;

    for (int i = 0; i < maxRaymarchSteps; i++) {
        vec3 currentRayPosition = rayOrigin + rayDir * depth;
        float sdfDist = scene(currentRayPosition);
        if (sdfDist < raymarchEpsilon) return depth;
        depth += sdfDist;
        if (sdfDist >= maxRaymarchDepth) return maxRaymarchDepth;
    }
    return maxRaymarchDepth;
}

vec3 sdfNormal(vec3 eyePos, vec3 dir, float dist) {
    vec3 rayPos = eyePos + dir*dist;

    // Replace "sdfFunc" with your SDF scene function
    vec3 eps = vec3(raymarchEpsilon, 0.0, 0.0);
    return normalize(vec3(
        scene(rayPos + eps.xyz) - scene(rayPos - eps.xyz),
        scene(rayPos + eps.yxz) - scene(rayPos - eps.yxz),
        scene(rayPos + eps.yzx) - scene(rayPos - eps.yzx)
    ));
}

void main () {
    vec3 eyeDir = perspectiveRayDirection(45.0);
    vec3 eyePos = vec3(10);
    mat3 viewMat = lookAt(eyePos, vec3(0,0,0), vec3(0, 1, 0));
    vec3 dir = viewMat * eyeDir;
    float dist = raymarchSDF(eyePos, dir);

    if (dist > maxRaymarchDepth - raymarchEpsilon) {
        gl_FragColor = vec4(black, 1.0);
    } else {
        vec3 normal = sdfNormal(eyePos, dir, dist);
    	vec3 albedo = (normal + 1.0) / 2.0;
    	vec3 l = vec3(0.0, 1, 1);
    	float diffuse = lambertDiffuse(normal, l);
    	vec3 specular = white * blinnPhongSpecular(dir, normal, l, 128.0);

    	gl_FragColor = vec4((diffuse * (albedo + specular) + albedo*0.1), 1.0);
    }
    
}