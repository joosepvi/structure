function roundOne(initialValue) {
    return Math.round(10 * initialValue) / 10;
}
function roundTwo(initialValue) {
    return Math.round(100 * initialValue) / 100;
}
function roundThree(initialValue) {
    return Math.round(1000 * initialValue) / 1000;
}


function calculateMasonryCompCharStrength(kFactor, brickStrength, mortarStrength) {
    // Calculate compressive strength of masonry in N/mm^2
    if (document.getElementById('checkbox-toggle').checked) {
        return kFactor * Math.pow(brickStrength, 0.85);
    } else {
        return kFactor * Math.pow(brickStrength, 0.7) * Math.pow(mortarStrength, 0.3);
    }
}
function calculateMasonryCompDesignStrength(masonryCharStrength) {
    return masonryCharStrength/1.7;
}
function calculateMomentFromPointLoad(pointLoad, eccentricity) {
    // Calculate the moment at the top of the wall from the point load in kNm
    return pointLoad*eccentricity;
}
function calculateMomentFromWindLoad(windLoad, height) {
    // Calculate the moment in the middle of the wall from the wind load in kNm
    return -windLoad*height*height/8;
}
function calculateEccentricityAccidental(height) {
    return height/300;
}
function calculateEccentricityCreep(height, thickness, eccentricityInitialMid, eccentricityAccidental) {
    const creepFactor = 1.0;
    return 0.002 * creepFactor * (height/thickness) * Math.sqrt(thickness*(eccentricityInitialMid+eccentricityAccidental));
}


function calculateResistanceLoad(pointLoad, windLoad, eccentricity, thickness, height, width, masonryCharStrength) {
    const h = height; // Height of wall in meters
    const b = width; // Width of wall in meters
    const t = thickness; // Thickness of the wall in meters
    const fMk = masonryCharStrength;
    const hEff = h; // Effective height of wall (fixed to height of wall)

    // Calculate masonry design compressive strength
    const fMd = calculateMasonryCompDesignStrength(fMk);

    // Calculate accidental eccentricity
    const eccentricityAccidental = calculateEccentricityAccidental(hEff);

    // Calculate bending moment
    const mEdTop = calculateMomentFromPointLoad(pointLoad, eccentricity); // Bending moment at the top of the wall in kNm
    const mEdWind = calculateMomentFromWindLoad(windLoad, h); // Maximum bending moment from the wind load
    const mEdMid = 0.6 * mEdTop + mEdWind; // Max bending moment near the center of the wall in kNm

    // Calculate eccentricity
    const eccentricityInitialMid = Math.abs(mEdMid/pointLoad);
    const eccentricityCreep = calculateEccentricityCreep(hEff, thickness, eccentricityInitialMid, eccentricityAccidental);
    
    // Calculate the compression area of the wall
    const eccentricityTop = Math.max(eccentricity + eccentricityAccidental, 0.05*thickness);
    const eccentricityMid = Math.max(eccentricityInitialMid + eccentricityAccidental + eccentricityCreep, 0.05*thickness);
    const AcTop = Math.max(b * (t - 2 * eccentricityTop), 0); // at the top
    const AcMid = Math.max(b * (t - 2 * eccentricityMid), 0); // near the center

    // Calculate the slenderness reduction factor
    const slenderness = h/t;
    const u = (slenderness - 2) / (23 - 37 * eccentricityMid/thickness);
    const chi = Math.pow(Math.E, -u*u/2);

    // Calculate axial load resistance
    const nRdTop = fMd * AcTop * 1000; // Axial load resistance at the top in kN
    const nRdMid = chi * fMd * AcMid * 1000; // Axial load resistance near the middle in kN


    document.getElementById("vahetulemused").innerHTML = `Vahetulemused: <br>
                e_Top = ${roundOne(eccentricity*1000)} mm <br>
				e_Mid = ${roundOne(eccentricityInitialMid*1000)} mm <br>
				e_init = ${roundOne(eccentricityAccidental*1000)} mm <br>
				e_k = ${roundOne(eccentricityCreep*1000)} mm <br>
				e_mk,Top = ${roundOne(eccentricityTop*1000)} mm <br>
				e_mk,Mid = ${roundOne(eccentricityMid*1000)} mm <br>
				A_c,Top = ${roundThree(AcTop)} m2 <br>
				A_c,Mid = ${roundThree(AcMid)} m2 <br>
				lambda_h = ${roundTwo(slenderness)} (< 27 !)<br>
				u = ${roundTwo(u)} <br>
				chi = ${roundTwo(chi)} <br>
				N_Rd,Top = ${roundTwo(nRdTop)} kN <br>
				N_Rd,Mid = ${roundTwo(nRdMid)} kN <br>`;

    //return AcMid;
    return Math.min(nRdTop, nRdMid);
}


function updateFormula(){
    if (document.getElementById('checkbox-toggle').checked) {
        document.getElementById('jamemort').style.display = "block";
        document.getElementById('peenmort').style.display = "none";
        document.getElementById('mortar-input').style.display = "none";
    } else {
        document.getElementById('jamemort').style.display = "none";
        document.getElementById('peenmort').style.display = "block";
        document.getElementById('mortar-input').style.display = "flex";
    }
}



function updateResult() {
    const pointLoad = parseFloat(document.getElementById("pointLoad").value);
    const windLoad = parseFloat(document.getElementById("windLoad").value);
    const eccentricity = parseFloat(document.getElementById("eccentricity").value);
    const height = parseFloat(document.getElementById("height").value);
    const width = parseFloat(document.getElementById("width").value);
    const thickness = parseFloat(document.getElementById("thickness").value);
    const brickStrength = parseFloat(document.getElementById("brick-strength").value);
    const mortarStrength = parseFloat(document.getElementById("mortar-strength").value);
    const kFactor = parseFloat(document.getElementById("k-factor").value);

    const masonryCharStrength = calculateMasonryCompCharStrength(kFactor, brickStrength, mortarStrength);
    const masonryDesignStrength = calculateMasonryCompDesignStrength(masonryCharStrength);

    const resistanceLoad = calculateResistanceLoad(pointLoad, windLoad, eccentricity, thickness, height, width, masonryCharStrength);

    document.getElementById("masonryCharacteristicStrength").innerHTML = roundTwo(masonryCharStrength);
    document.getElementById("masonryDesignStrength").innerHTML = roundTwo(masonryDesignStrength);
    document.getElementById("structuralResistanceLoad").innerHTML = roundOne(resistanceLoad);
}


function visualize() {
    const canvas = document.getElementById('diagram');
    const ctx = canvas.getContext('2d');
    const thickness = parseFloat(document.getElementById('thickness').value);
    const height = parseFloat(document.getElementById('height').value);
    const pointLoad = parseFloat(document.getElementById('pointLoad').value);
    const windLoad = parseFloat(document.getElementById('windLoad').value);
    const eccentricity = parseFloat(document.getElementById('eccentricity').value);

    // Define useful parameters for drawing
    const pd = 40;
    const sc = 100;
    const scDiagram = 25;
    const wWindLoad = Math.abs(windLoad)*scDiagram;

    // Calculate bending moments
    const mEdTop = calculateMomentFromPointLoad(pointLoad, eccentricity); // Bending moment at the top of the wall in kNm
    const mEdWind = calculateMomentFromWindLoad(windLoad, height); // Maximum bending moment from the wind load
    const mEd125 = 0.125 * mEdTop + 0.4375*mEdWind;
    const mEd25 = 0.25 * mEdTop + 0.75*mEdWind; // Bending moment at the lower quarter of the wall in kNm
    const mEd375 = 0.375 * mEdTop + 0.9375*mEdWind;
    const mEd50 = 0.5 * mEdTop + mEdWind; // Bending moment at the center of the wall in kNm
    const mEd625 = 0.625 * mEdTop + 0.9375*mEdWind;
    const mEd75 = 0.75 * mEdTop + 0.75*mEdWind; // Bending moment at the upper quarter of the wall in kNm
    const mEd875 = 0.875 * mEdTop + 0.4375*mEdWind;

    // Find the max and the min
    const mEdMin = Math.min(mEdTop, mEd50, mEd625, mEd75, -1);
    const mEdMax = Math.max(mEdTop, mEd50, mEd625, mEd75, 0);

    // Set suitable canvas dimensions
    const cWidth = 2*pd + wWindLoad + 20 + sc*thickness + 20 + scDiagram*(mEdMax-mEdMin);
    const cHeight = 2*pd + sc*height + 0.5*pointLoad+20;
    canvas.width = cWidth;
    canvas.height = cHeight;

    // Clear canvas
    ctx.clearRect(0, 0, cWidth, cHeight);
    // Set the line width and color
    ctx.lineWidth = 1;
    ctx.strokeStyle = "Black";

    // Draw wall
    ctx.rect(pd + wWindLoad + 20, cHeight - pd, thickness * sc, -height * sc);
    ctx.fillStyle = 'lightgrey';
    ctx.fill();
    ctx.stroke();

    // Draw pointload arrow
    ctx.beginPath();
    ctx.moveTo(pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc, cHeight - height * sc - pd - 0.5*pointLoad-20);
    ctx.lineTo(pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc, cHeight - height * sc - pd);
    ctx.lineTo(pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc + 5, cHeight - height * sc - pd - 10);
    ctx.moveTo(pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc, cHeight - height * sc - pd);
    ctx.lineTo(pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc - 5, cHeight - height * sc - pd - 10);
    ctx.strokeStyle = "blue";
    ctx.stroke();

    // Draw distributed load
    ctx.rect(pd, cHeight - pd, wWindLoad, -height*sc);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Set the start and end points of the diagram
    const startX = pd + wWindLoad + 20 + thickness*sc + 20 + mEdMax*scDiagram;
    const startY = cHeight - height*sc - pd;
    const endX = pd + wWindLoad + 20 + thickness*sc + 20 + mEdMax*scDiagram;
    const endY = cHeight - pd;

    // Set the control point of the curve
    const curveStartX = startX - mEdTop*scDiagram;
    const curveStartY = startY;
    const curve875X = startX - mEd875*scDiagram;
    const curve875Y = startY + (endY-startY)/8;
    const curve75X = startX - mEd75*scDiagram;
    const curve75Y = startY + (endY-startY)/4;
    const curve625X = startX - mEd625*scDiagram;
    const curve625Y = startY + (endY-startY)*3/8;
    const curve50X = startX - mEd50*scDiagram;
    const curve50Y = (startY + endY)/2;
    const curve375X = startX - mEd375*scDiagram;
    const curve375Y = startY + (endY-startY)*5/8;
    const curve25X = startX - mEd25*scDiagram;
    const curve25Y = startY + (endY-startY)*3/4;
    const curve125X = startX - mEd125*scDiagram;
    const curve125Y = startY + (endY-startY)*7/8;


    // Set the diagram line width and color
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";

    // Draw the diagram curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(curveStartX, curveStartY);

    ctx.lineTo(curve875X, curve875Y);
    ctx.lineTo(curve75X, curve75Y);
    ctx.lineTo(curve625X, curve625Y);
    ctx.lineTo(curve50X, curve50Y);
    ctx.lineTo(curve375X, curve375Y);
    ctx.lineTo(curve25X, curve25Y);
    ctx.lineTo(curve125X, curve125Y);
    ctx.lineTo(endX, endY);

    ctx.lineTo(startX, startY);

    ctx.fillStyle = "rgba(255,0,0,0.05)";
    ctx.fill();
    ctx.stroke();



    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(roundTwo(0.6*mEdTop+mEdWind) + " kNm", startX + 5, (curve50Y-10*height));
    ctx.fillText(roundTwo(mEdTop) + " kNm", startX + 5, curveStartY);
    ctx.fillText(roundTwo(pointLoad) + " kN", pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc + 5, cHeight - height * sc - pd - 0.5*pointLoad-20);
    ctx.fillText("e = " + 1000*eccentricity + " mm", pd + wWindLoad + 20 + (thickness/2 + eccentricity)*sc + 5, cHeight - height * sc - pd - 0.5*pointLoad-5);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = "center";
    ctx.fillText(roundTwo(windLoad) + " kN/m", -cHeight + 0.5*height*sc + pd, pd - 5);
    ctx.restore();

}


function updateAll() {
    updateResult();
    visualize();
}