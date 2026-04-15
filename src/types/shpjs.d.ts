declare module 'shpjs' {
  type GeoJSONFeatureCollection = {
    type: 'FeatureCollection';
    features: Array<Record<string, unknown>>;
  };

  const shp: (data: ArrayBuffer | string) => Promise<GeoJSONFeatureCollection | GeoJSONFeatureCollection[]>;
  export default shp;
}
