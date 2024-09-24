const generateOtp = ()=>{
    length=6;
    otp="";
    for(let i=0; i<length;i++){
        otp +=Math.floor(Math.random()*10);
    }
    return otp;
}
// console.log(generateOtp());
const genotp = generateOtp();
module.exports = genotp;