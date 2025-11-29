const btnleckchw = document.querySelector('.add-lekchw');

btnleckchw.addEventListener('click', () => {
   const listleckchw = document.createElement('div');
    listleckchw.classList.add('list-lekchw');
    listleckchw.innerHTML = `
        <input type="text" class="name-lekchw" placeholder="ناوی شاشە">
        <button class="save-lekchw">لێكچوەکان چین</button>


        const leck = listleckchw.querySelector('.save-lekchw');
        leck.addEventListener('click', () => {
            <input>type="text" class="amount-lekchw" placeholder="بڕی لێكچوە">
             });
       
    `;
    document.body.appendChild(listleckchw);
});