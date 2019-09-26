let jsonResult;
let deckId;

let getCard = async (url, num, player) => {
    try {
        url += num;
        const response = await fetch(url);
        jsonResult = await response.json();
        deckId = jsonResult.deck_id;
        console.log(deckId);
        let imgSrc = jsonResult.cards[0].image;
        console.log(imgSrc);
        let playerHand = document.getElementById(player);
        let image = document.createElement("img");
        image.src = imgSrc;
        image.style = 'width: 100px;';
        playerHand.appendChild(image);

    } catch (err) {
        console.log(err);
    }
};

let initialize = () =>{
    let url = "https://deckofcardsapi.com/api/deck/" + deckId + "/draw/?count =";
    getCard(url, 1, "human");
};
let drawCard = () => {
    let url = "https://deckofcardsapi.com/api/deck/" + deckId + "/draw/?count =";
    getCard(url, 1, "human");
};

getCard("https://deckofcardsapi.com/api/deck/new/draw/?count=", 1, "human");

let draw = document.getElementById("deck");
deck.addEventListener('click', drawCard);