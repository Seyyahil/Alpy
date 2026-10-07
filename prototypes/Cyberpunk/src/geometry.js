// One welded perimeter. Every diagonal has equal x/y offsets (45 degrees).
// Cut depths resolve from canonical Space; label bays follow rendered content.
export function contourPath(width,height,cut,stroke,kind='panel',labelEnd){
 const s=stroke/2,w=width-s,h=height-s;
 const heightLimit=(h-s)/(kind==='control'?2:4);
 const c=Math.min(cut,(w-s)/6,heightLimit),d=c/2;
 if(kind==='control')return `M ${s+c} ${s} H ${w} V ${h-c} L ${w-c} ${h} H ${s} V ${s+c} Z`;
 if(kind==='media')return `M ${s} ${s} H ${w*.65} l ${c} ${c} H ${w} V ${h-c} L ${w-c} ${h} H ${s+c} L ${s} ${h-c} V ${h*.65} l ${d} ${-d} V ${h*.4} l ${-d} ${-d} Z`;
 const shoulder=kind==='capability'?Math.max(s+c,Math.min(labelEnd??w*.25,w-c*2)):w*.64;
 return `M ${s+c} ${s} H ${shoulder} l ${c} ${c} H ${w} V ${h-d} L ${w-d} ${h} H ${s+c} L ${s} ${h-c} V ${s+c} Z`;
}
