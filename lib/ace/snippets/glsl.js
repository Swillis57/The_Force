ace.define("ace/snippets/glsl",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.snippetText ="## Shapes\n\
# box\n\
snippet box\n\
	box(vec2($1, $2), vec2($3, $4), ${5: float}, ${6:float})${7}\n\
# circle\n\
snippet cir\n\
	circle(${1:float}, ${2:float}, ${3:float}, ${4:float})${5}\n\
## Functions\n\
#rotate\n\
snippet rot\n\
	rotate(${1:vec2}, ${2:vec2}, ${3:float})${4}\n\
#snoise\n\
snippet sno\n\
	snoise(${1:vec2})$2\n\
#fractal noise\n\
snippet fractal\n\
	fractal(${1:vec2})${2}\n\
#turbulence\n\
snippet turb\n\
	turbulence(${1:vec2}, ${2:float})$3\n\
#nyan frame\n\
snippet nyan\n\
	nyanFrame(${1:vec2}, ${2:float})$3\n\
## Quick stuff\n\
#vec2\n\
snippet vc\n\
	vec2\n\
#vec3\n\
snippet vvc\n\
	vec3\n\
#float\n\
snippet ft\n\
	float\n\
## Compile Helpers\n\
# if false\n\
snippet iff\n\
	if (false) {\n\
		${1}\n\
	}\n\
##\n\
## Loops\n\
# for integer\n\
snippet fori\n\
	for (int i = 0; i < ${1:int}; i++) {\n\
		${2}\n\
	}${3}\n\
# for float\n\
snippet forf\n\
	for (float i = 0.0; i < ${1:float}; i++) {\n\
		${2}\n\
	}${3}\n\
##\
## SDF\n\
# SDF raymarch function template\n\
snippet raymarch\n\
	float raymarchSDF(vec3 rayOrigin, vec3 rayDir) {\n\
		float depth = minRaymarchDepth;\n\
		\n\
		for (int i = 0; i < maxRaymarchSteps; i++) {\n\
			vec3 currentRayPosition = rayOrigin + rayDir * depth;\n\
			float sdfDist = /* Your SDF scene function here; see scene snippet */;\n\
			if (sdfDist < raymarchEpsilon) return depth;\n\
			depth += sdfDist;\n\
			if (sdfDist >= maxRaymarchDepth) return maxRaymarchDepth;\n\
		}\n\
		return maxRaymarchDepth;\n\
	}\n\
#SDF scene function template\n\
snippet scene\n\
	float sceneSDF(vec3 currentRayPosition) {\n\
		float s = sdfSphere(currentRayPosition, 1.0); // Sphere at origin with radius 1.0\n\
		float b = sdfBox(currentRayPosition, vec3(1.0, 1.0, 1.0)); // Box at origin\n\
		return sdfUnion(s, b); // Combine both into a single sdf area\n\
	}\n\
#SDF constants\n\
snippet constants\n\
	//You may change these to your liking\n\
	const int maxRaymarchSteps = 255;\n\
	const float minRaymarchDepth = 0.0;\n\
	const float maxRaymarchDepth = 1000.0;\n\
#SDF normal func\n\
snippet sdfNormal\n\
	vec3 sdfNormal(vec3 eyePos, vec3 dir, float dist) {\n\
		vec3 rayPos = eyePos + dir*dist;\n\
		\n\
		// Replace \"sdfFunc\" with your SDF scene function\n\
		vec3 eps = vec3(raymarchEpsilon, 0.0, 0.0);\n\
		return normalize(vec3(\n\
			sdfFunc(rayPos + eps.xyz) - sdfFunc(rayPos - eps.xyz),\n\
			sdfFunc(rayPos + eps.yxz) - sdfFunc(rayPos - eps.yxz),\n\
			sdfFunc(rayPos + eps.yzx) - sdfFunc(rayPos - eps.yzx)\n\
		));\n\
	}\n\
##\n\
";
exports.scope = "glsl";

});