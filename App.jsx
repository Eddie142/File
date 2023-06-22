import {useState} from 'react'
import './app.js'
import './index.html'
import  {BrowserRouter, Route, Routes} from 'react-router-dom'
function App(){ 

    return(
        <BrowserRouter>
         <Routes>
             <Route path= "/" exact component ={index.html}>
                 
             </Route>
         </Routes>
        </BrowserRouter>
    )
}

export default App