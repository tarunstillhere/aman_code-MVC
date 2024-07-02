(() => {

    document.addEventListener("DOMContentLoaded", async () => {

        const selectDrop = document.querySelector("#country_code");

        try {
            let response = await fetch("https://country.io/phone.json")
            let data = await response.json()
            console.log(data)
        } catch (error) {
            console.error(error)
        }

    });

})();