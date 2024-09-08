document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("text-to-speech-btn");

    // Make sure the button exists
    if (button) {
        // Ensure voices are loaded properly
        window.speechSynthesis.onvoiceschanged = function () {
            console.log("Voices have been loaded");
        };

        function readAloud() {
            // Ensure the speechSynthesis API is supported
            if (!window.speechSynthesis) {
                alert("Sorry, your browser does not support text-to-speech.");
                return;
            }

            const content = document.body.innerText;
            const speech = new SpeechSynthesisUtterance(content);
            speech.lang = "en-US";
            speech.rate = 1;  // Set speed to normal

            // Try to get the voices available
            const voices = window.speechSynthesis.getVoices();

            // If voices aren't loaded, handle this case
            if (!voices.length) {
                console.error("No voices available");
                return;
            }

            // Ensure a natural-sounding voice is selected or fallback to default
            const selectedVoice = voices.find(voice =>
                voice.name.includes("Google US English") ||
                voice.name.includes("Microsoft David") ||
                voice.default
            );

            // If a voice is found, assign it
            if (selectedVoice) {
                speech.voice = selectedVoice;
            } else {
                console.warn("No preferred voice found, using default.");
            }

            // Speak the content
            window.speechSynthesis.speak(speech);
        }

        // Add the event listener to the button
        button.addEventListener("click", readAloud);
    } else {
        console.error("Text-to-speech button not found!");
    }
});
