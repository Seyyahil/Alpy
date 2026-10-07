// Margin shapes retain their size; the page layer crops overflow on narrower screens.
export function exteriorPosition({side, width, height, base, anchor, next, clear, inset, level='center'}) {
  if (!width || !height) return null;
  let left, top;
  if (side === 'gap') {
    const available = next ? next.top-anchor.bottom : 0;
    if (available < height+inset) return null;
    left = anchor.left-base.left+(anchor.width-width)/2;
    top = anchor.bottom-base.top+(available-height)/2;
  } else {
    if (anchor.height < height+clear*2) return null;
    left = side === 'left' ? anchor.left-base.left-clear-width : anchor.right-base.left+clear;
    const fraction = level==='upper' ? .25 : level==='lower' ? .75 : .5;
    const offset = Math.max(clear,Math.min((anchor.height-height)*fraction,anchor.height-height-clear));
    top = anchor.top-base.top+offset;
  }
  if (side==='gap' && (left < inset || left+width > base.width-inset)) return null;
  if (top < 0 || top+height > base.height) return null;
  return {left,top};
}

// Decorative paths use each SVG's rendered dimensions and the existing spacing tokens.
export function accentPaths(kind, width, height, unit) {
  const x = width / 2, y = height / 2;
  const radius = Math.max(0, Math.min(x, y) - unit);
  const cross = (cx, cy, arm) => `M ${cx-arm} ${cy} H ${cx+arm} M ${cx} ${cy-arm} V ${cy+arm}`;
  const circle = (cx, cy, r) => `M ${cx-r} ${cy} a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 ${-r*2} 0`;
  const arc = (r, start, end) => {
    const point = angle => [x+r*Math.cos(angle*Math.PI/180), y+r*Math.sin(angle*Math.PI/180)];
    const a = point(start), b = point(end);
    return `M ${a.join(' ')} A ${r} ${r} 0 ${end-start>180?1:0} 1 ${b.join(' ')}`;
  };
  if (kind === 'cross') return [{d:cross(x,y,radius)}];
  if (kind === 'diagonal-cross') return [{d:`M ${x-radius} ${y-radius} l ${radius*2} ${radius*2} M ${x-radius} ${y+radius} l ${radius*2} ${-radius*2}`}];
  if (kind === 'diamond') return [{d:`M ${x} ${y-radius} L ${x+radius} ${y} L ${x} ${y+radius} L ${x-radius} ${y} Z`}];
  if (kind === 'ticks') {
    const step = (height-unit*2)/4;
    return [{d:Array.from({length:5},(_,i)=>`M ${unit} ${unit+i*step} H ${width-unit-(i%2)*unit}`).join(' ')}];
  }
  if (kind === 'hex-stack') {
    const r = Math.min(x-unit,(height-unit*3)/4);
    return [-1,1].map(offset=>{
      const cy = y+offset*(r+unit/2);
      const points = Array.from({length:6},(_,i)=>`${x+r*Math.cos(i*Math.PI/3)} ${cy+r*Math.sin(i*Math.PI/3)}`);
      return {d:`M ${points.join(' L ')} Z`};
    });
  }
  if (kind === 'circuit') {
    const cut = Math.min(unit,(width-unit*2)/2);
    return [{d:`M ${unit} ${unit} V ${y-cut} l ${cut} ${cut} H ${width-unit-cut} l ${cut} ${cut} V ${height-unit} M ${unit*2} ${unit} V ${unit*2}`}];
  }
  if (kind === 'bracket-pair') return [{d:`M ${unit} ${y} V ${unit} H ${x} M ${width-unit} ${y} V ${height-unit} H ${x}`}];
  if (kind === 'corner') {
    const inset = unit, cut = Math.min(width,height)/2-inset;
    return [{d:`M ${inset} ${height-inset} H ${width-inset-cut} l ${cut} ${-cut} V ${inset} M ${inset} ${y} V ${inset} H ${x}`}];
  }
  if (kind === 'arc') return [{d:`${arc(radius,200,335)} ${arc(radius,20,125)} ${cross(x,y,unit/2)}`}];
  if (kind === 'hexagons') {
    const r = Math.min(height/3-unit/4,(width-unit*4)/6);
    const cy = [height-r-unit/2,r+unit/2,height-r-unit/2];
    return [0,1,2].map(i => {
      const cx = x+(i-1)*(r*2+unit/2);
      const points = Array.from({length:6},(_,j)=>`${cx+r*Math.cos(j*Math.PI/3)} ${cy[i]+r*Math.sin(j*Math.PI/3)}`);
      return {d:`M ${points.join(' L ')} Z`,emphasis:i===1};
    });
  }
  if (kind === 'trace') {
    const cx = height/2, cy = height/2, r = height/2-unit;
    const rise = cy-unit/2;
    return [
      {d:`${circle(cx,cy,r)} ${circle(cx,cy,unit/2)} M ${cx} ${cy} l ${rise} ${-rise} H ${width-unit} M ${width-unit*4} ${unit*1.5} H ${width-unit*2}`},
      {d:circle(cx,cy,unit/8),emphasis:true},
    ];
  }
  if (kind === 'reticle') {
    const r = radius-unit/2;
    return [
      {d:`${circle(x,y,r)} ${circle(x,y,r/3)} ${arc(radius,15,65)} ${arc(radius,150,175)} M ${x} ${unit/4} V ${unit/2} M ${width-unit/2} ${y} H ${width-unit/4} M ${x} ${height-unit/2} V ${height-unit/4}`},
      {d:arc(radius,215,275),emphasis:true},
    ];
  }
  if (kind === 'chevrons') {
    const arm = (height-unit)/2;
    return [{d:[-1,1].map(i=>`M ${x+i*unit-arm/2} ${y-arm} l ${arm} ${arm} l ${-arm} ${arm}`).join(' ')}];
  }
  return [];
}
