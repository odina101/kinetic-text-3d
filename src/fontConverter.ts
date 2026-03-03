interface TypefaceGlyph {
  ha: number;
  x_min: number;
  x_max: number;
  o: string;
}

export interface TypefaceData {
  glyphs: Record<string, TypefaceGlyph>;
  familyName: string;
  ascender: number;
  descender: number;
  underlinePosition: number;
  underlineThickness: number;
  boundingBox: {
    yMin: number;
    xMin: number;
    yMax: number;
    xMax: number;
  };
  resolution: number;
}

export function opentypeToTypeface(otFont: any): TypefaceData {
  const scale = (1000 * 100) / ((otFont.unitsPerEm || 2048) * 72);
  const r = (v: number) => Math.round(v * scale);
  const glyphs: Record<string, TypefaceGlyph> = {};

  for (let i = 0; i < otFont.glyphs.length; i++) {
    const glyph = otFont.glyphs.get(i);
    if (glyph.unicode === undefined) continue;
    let o = '';
    glyph.path.commands.forEach((cmd: any) => {
      switch (cmd.type) {
        case 'M': o += `m ${r(cmd.x)} ${r(cmd.y)} `; break;
        case 'L': o += `l ${r(cmd.x)} ${r(cmd.y)} `; break;
        case 'Q': o += `q ${r(cmd.x)} ${r(cmd.y)} ${r(cmd.x1)} ${r(cmd.y1)} `; break;
        case 'C': o += `b ${r(cmd.x)} ${r(cmd.y)} ${r(cmd.x1)} ${r(cmd.y1)} ${r(cmd.x2)} ${r(cmd.y2)} `; break;
      }
    });
    glyphs[String.fromCodePoint(glyph.unicode)] = {
      ha: Math.round((glyph.advanceWidth || 0) * scale),
      x_min: Math.round((glyph.xMin || 0) * scale),
      x_max: Math.round((glyph.xMax || 0) * scale),
      o: o.trim(),
    };
  }

  return {
    glyphs,
    familyName: otFont.names.fontFamily
      ? (otFont.names.fontFamily.en || Object.values(otFont.names.fontFamily)[0])
      : 'Font',
    ascender: Math.round(otFont.ascender * scale),
    descender: Math.round(otFont.descender * scale),
    underlinePosition: Math.round(
      ((otFont.tables.post && otFont.tables.post.underlinePosition) || -100) * scale
    ),
    underlineThickness: Math.round(
      ((otFont.tables.post && otFont.tables.post.underlineThickness) || 50) * scale
    ),
    boundingBox: {
      yMin: Math.round(otFont.tables.head.yMin * scale),
      xMin: Math.round(otFont.tables.head.xMin * scale),
      yMax: Math.round(otFont.tables.head.yMax * scale),
      xMax: Math.round(otFont.tables.head.xMax * scale),
    },
    resolution: 1000,
  };
}
