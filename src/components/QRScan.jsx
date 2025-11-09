import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./ComponentCSS/QRScan.css"
import { useNavigate } from "react-router-dom";


function QRScan () {

const [scanResult, setScanResult]= useState(null);
const navigate = useNavigate();

let scanner;
useEffect(()=>{
  if(!scanner?.getState()){
   scanner = new Html5QrcodeScanner('reader', {
  qrbox: {
    width:250,
    height:250,
  },
  
  aspectRatio:1,
  fps: 5,
  
 
  })
  };
  scanner.render(success, error);

  function success(result){
    scanner.clear();
    setScanResult(result);
    navigate('/item', { state: { id: result } });
    
  }

  function error(err){
    console.warn(err);
  }
  }, []);


  return (
    <><div className="backgr">
      <div className="box-inner">
        <button className="close-btn" onClick={() => navigate('/')}>✕</button>
      
          <div id="reader"></div>
          </div>
    </div></>
  );
    
}

export default QRScan;