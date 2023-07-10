function calculateMasonryCompressiveStrength(kFactor, brickStrength, mortarStrength) {
    // Calculate compressive strength of masonry in N/mm^2
    return kFactor * Math.pow(brickStrength, 0.7) * Math.pow(mortarStrength, 0.3);
}

function calculateMomentFromLoad(load, eccentricity) {
    // Calculate the moment at the top of the wall from the point load in kNm
    return load*eccentricity;
}

function calculateMomentFromWindLoad(windLoad, height) {
    // Calculate the moment in the middle of the wall from the wind load in kNm
    return -windLoad*height*height/8;
}

function calculateEccentricityAccidental(height) {
    return height/300;
}

function roundOne(initialValue) {
    return Math.round(10 * initialValue) / 10;
}
function roundTwo(initialValue) {
    return Math.round(100 * initialValue) / 100;
}
function roundThree(initialValue) {
    return Math.round(1000 * initialValue) / 1000;
}

function calculateEccentricityCreep(height, thickness, eccentricityInitialMid, eccentricityAccidental) {
    const creepFactor = 1.0;
    return 0.002 * creepFactor * (height/thickness) * Math.sqrt(thickness*(eccentricityInitialMid+eccentricityAccidental));
}

function calculateStructuralResistanceLoad(load, windLoad, eccentricity, thickness, height, width, masonryStrength) {
    const h = height; // Height of wall in meters
    const b = width; // Width of wall in meters
    const t = thickness; // Thickness of the wall in meters
    const fM = masonryStrength;
    const hEff = h; // Effective height of wall (fixed to height of wall)

    // Calculate accidental eccentricity
    const eccentricityAccidental = calculateEccentricityAccidental(hEff);

    // Calculate bending moment
    const mEdTop = calculateMomentFromLoad(load, eccentricity); // Bending moment at the top of the wall in kNm
    const mEdWind = calculateMomentFromWindLoad(windLoad, h); // Maximum bending moment from the wind load
    const mEdMid = 0.6 * mEdTop + mEdWind; // Max bending moment near the center of the wall in kNm

    // Calculate eccentricity
    const eccentricityInitialMid = Math.abs(mEdMid/load);
    const eccentricityCreep = calculateEccentricityCreep(hEff, thickness, eccentricityInitialMid, eccentricityAccidental);


    // Calculate the compression area of the wall
    const eccentricityTop = eccentricity + eccentricityAccidental;
    const eccentricityMid = eccentricityInitialMid + eccentricityAccidental + eccentricityCreep;
    const AcTop = b * (t - 2 * eccentricityTop); // at the top
    const AcMid = b * (t - 2 * eccentricityMid); // near the center

    // Calculate the slenderness reduction factor
    const slenderness = h/t;
    const u = (slenderness - 2) / (23 - 37 * eccentricityMid/thickness);
    const chi = Math.pow(Math.E, -u*u/2);

    // Calculate axial load resistance
    const nRdTop = fM/1.7 * AcTop * 1000; // Axial load resistance at the top in kN
    const nRdMid = chi * fM/1.7 * AcMid * 1000; // Axial load resistance near the middle in kN


    document.getElementById("vahetulemused").innerHTML = `e_mTop = ${roundThree(eccentricity)} m <br>
				e_mMid = ${roundThree(eccentricityInitialMid)} m <br>
				e_a = ${roundThree(eccentricityAccidental)} m <br>
				e_k = ${roundThree(eccentricityCreep)} m <br>
				e_Top = ${roundThree(eccentricityTop)} m <br>
				e_Mid = ${roundThree(eccentricityMid)} m <br>
				A_cTop = ${roundThree(AcTop)} m2 <br>
				A_cMid = ${roundThree(AcMid)} m2 <br>
				lambda = ${roundTwo(slenderness)} <br>
				chi = ${roundTwo(chi)} <br>
				N_RdTop = ${roundTwo(nRdTop)} kN <br>
				N_RdMid = ${roundTwo(nRdMid)} kN <br>`;

    //return AcMid;
    return Math.min(nRdTop, nRdMid);
}


function updateResult() {
    const load = parseFloat(document.getElementById("load").value);
    const windLoad = parseFloat(document.getElementById("windLoad").value);
    const eccentricity = parseFloat(document.getElementById("eccentricity").value);
    const height = parseFloat(document.getElementById("height").value);
    const width = parseFloat(document.getElementById("width").value);
    const thickness = parseFloat(document.getElementById("thickness").value);
    const brickStrength = parseFloat(document.getElementById("brick-strength").value);
    const mortarStrength = parseFloat(document.getElementById("mortar-strength").value);
    const kFactor = parseFloat(document.getElementById("k-factor").value);

    const masonryCharacteristicStrength = calculateMasonryCompressiveStrength(kFactor, brickStrength, mortarStrength);
    const masonryDesignStrength = masonryCharacteristicStrength/1.7;

    const structuralResistanceLoad = calculateStructuralResistanceLoad(load, windLoad, eccentricity, thickness, height, width, masonryCharacteristicStrength);

    document.getElementById("masonryCharacterisicStrength").innerHTML = `= ${roundTwo(masonryCharacteristicStrength)} MPa`;
    document.getElementById("masonryDesignStrength").innerHTML = `= ${roundTwo(masonryDesignStrength)} MPa`;
    document.getElementById("structuralResistanceLoad").innerHTML = `Kandevõime: ${roundOne(structuralResistanceLoad)} kN`;
}


function visualize() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const cwidth = canvas.width;
    const cheight = canvas.height;

    const thickness = parseFloat(document.getElementById('thickness').value);
    const height = parseFloat(document.getElementById('height').value);
    const load = parseFloat(document.getElementById('load').value);
    const windLoad = parseFloat(document.getElementById('windLoad').value);
    const eccentricity = parseFloat(document.getElementById('eccentricity').value);



    // Clear canvas
    ctx.clearRect(0, 0, cwidth, cheight);
    // Set the line width and color
    ctx.lineWidth = 1;
    ctx.strokeStyle = "Black";



    // Draw wall
    ctx.beginPath();
    ctx.moveTo(cwidth/2, cheight-50);
    ctx.lineTo(cwidth/2, cheight - height * 100 - 50);
    ctx.lineTo(cwidth/2 + thickness * 100, cheight - height * 100 - 50);
    ctx.lineTo(cwidth/2 + thickness * 100, cheight - 50);
    ctx.stroke();

    // Draw load arrow
    ctx.beginPath();
    ctx.moveTo(cwidth/2 + (thickness/2 + eccentricity)*100, cheight - height * 100 - 50 - 0.5*load-20);
    ctx.lineTo(cwidth/2 + (thickness/2 + eccentricity)*100, cheight - height * 100 - 50);
    ctx.lineTo(cwidth/2 + (thickness/2 + eccentricity)*100 + 5, cheight - height * 100 - 50 - 10);
    ctx.moveTo(cwidth/2 + (thickness/2 + eccentricity)*100, cheight - height * 100 - 50);
    ctx.lineTo(cwidth/2 + (thickness/2 + eccentricity)*100 - 5, cheight - height * 100 - 50 - 10);
    ctx.stroke();



    // Calculate bending moments
    const mEdTop = calculateMomentFromLoad(load, eccentricity); // Bending moment at the top of the wall in kNm
    const mEdWind = calculateMomentFromWindLoad(windLoad, height); // Maximum bending moment from the wind load
    const mEdMid = 0.5 * mEdTop + mEdWind; // Bending moment at the center of the wall in kNm


    // Set the start and end points of the diagram
    const startX = cwidth/2 + thickness*100 + 50;
    const startY = cheight - height * 100 - 50;
    const endX = cwidth/2 + thickness*100 + 50;
    const endY = cheight - 50;

    // Set the control point of the curve
    const quadStartX = startX - mEdTop*10;
    const quadStartY = startY;
    const quadControlX = startX - mEdMid*10;
    const quadControlY = (startY + endY)/2;



    // Set the line width and color
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";

    // Draw the curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(quadStartX, quadStartY);
    ctx.quadraticCurveTo(quadControlX, quadControlY, endX, endY);
    ctx.lineTo(startX, startY);
    ctx.stroke();

    ctx.font = "12px Arial";
    ctx.fillText(Math.round((0.6 * mEdTop + mEdWind)*100)/100, startX, (quadControlY-10*height));
    ctx.fillText(Math.round(mEdTop*100)/100, startX, quadStartY);

}


function updateAll() {
    updateResult();
    visualize();
}