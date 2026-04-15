import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = path.resolve('public/examples/world-countries.geojson');
const outputPath = path.resolve('public/examples/world-countries.simplified.geojson');

function sqDist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function sqSegDist(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRadial(points, sqTolerance) {
  if (points.length <= 2) return points;
  const out = [points[0]];
  let prev = points[0];

  for (let i = 1; i < points.length - 1; i += 1) {
    if (sqDist(points[i], prev) > sqTolerance) {
      out.push(points[i]);
      prev = points[i];
    }
  }

  out.push(points[points.length - 1]);
  return out;
}

function simplifyDPStep(points, first, last, sqTolerance, marked) {
  let maxSqDist = sqTolerance;
  let index = -1;

  for (let i = first + 1; i < last; i += 1) {
    const sqDistance = sqSegDist(points[i], points[first], points[last]);
    if (sqDistance > maxSqDist) {
      index = i;
      maxSqDist = sqDistance;
    }
  }

  if (index !== -1) {
    marked[index] = true;
    simplifyDPStep(points, first, index, sqTolerance, marked);
    simplifyDPStep(points, index, last, sqTolerance, marked);
  }
}

function simplifyDouglasPeucker(points, sqTolerance) {
  if (points.length <= 2) return points;

  const marked = new Array(points.length).fill(false);
  marked[0] = true;
  marked[points.length - 1] = true;

  simplifyDPStep(points, 0, points.length - 1, sqTolerance, marked);

  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    if (marked[i]) out.push(points[i]);
  }
  return out;
}

function ensureClosedRing(coords) {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coords, first];
  }
  return coords;
}

function simplifyRing(ring, tolerance) {
  const sqTolerance = tolerance * tolerance;
  let simplified = simplifyRadial(ring, sqTolerance);
  simplified = simplifyDouglasPeucker(simplified, sqTolerance);

  if (simplified.length < 4) {
    return ensureClosedRing(ring.slice(0, Math.min(ring.length, 4)));
  }

  return ensureClosedRing(simplified);
}

function simplifyGeometry(geometry, tolerance) {
  if (!geometry) return geometry;

  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, tolerance)),
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) =>
        poly.map((ring) => simplifyRing(ring, tolerance))
      ),
    };
  }

  return geometry;
}

const tolerance = 0.08;

const raw = await fs.readFile(inputPath, 'utf8');
const geojson = JSON.parse(raw);

const simplified = {
  ...geojson,
  features: (geojson.features || []).map((feature) => ({
    ...feature,
    geometry: simplifyGeometry(feature.geometry, tolerance),
  })),
};

await fs.writeFile(outputPath, JSON.stringify(simplified));

const [srcStat, outStat] = await Promise.all([fs.stat(inputPath), fs.stat(outputPath)]);
console.log(`Input:  ${srcStat.size} bytes`);
console.log(`Output: ${outStat.size} bytes`);
console.log(`Saved:  ${Math.round((1 - outStat.size / srcStat.size) * 100)}%`);
