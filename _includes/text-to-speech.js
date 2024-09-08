document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("text-to-speech-btn");

    // Make sure the button exists
    if (button) {
        function readAloud() {
            const content = document.body.innerText;
            const speech = new SpeechSynthesisUtterance(content);
            speech.lang = "en-US";
            speech.rate = 1;

            // Try to get the voices available
            const voices = window.speechSynthesis.getVoices();

            // Ensure a natural-sounding voice is selected
            const selectedVoice = voices.find(voice =>
                voice.name.includes("Google US English") ||
                voice.name.includes("Microsoft David") ||
                voice.default
            );

            if (selectedVoice) {
                speech.voice = selectedVoice;
            }

            window.speechSynthesis.speak(speech);
        }

        // Add the event listener to the button
        button.addEventListener("click", readAloud);

        // Make sure voices are loaded before use
        window.speechSynthesis.onvoiceschanged = function () {
            console.log("Voices have been loaded");
        };
    } else {
        console.error("Text-to-speech button not found!");
    }
});
