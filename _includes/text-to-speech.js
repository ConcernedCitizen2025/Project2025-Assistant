document.addEventListener("DOMContentLoaded", function() {
    const button = document.getElementById("text-to-speech-btn");

    // Check if the button exists before adding event listener
    if (button) {
        // Function to read the text on the page
        function readAloud() {
            const content = document.body.innerText; // Get all text from the body
            const speech = new SpeechSynthesisUtterance(content); // Create speech object
            speech.lang = 'en-US'; // Set the language
            speech.rate = 1; // Adjust the speed of speech (1 is normal speed)

            // Get available voices
            const voices = window.speechSynthesis.getVoices();

            // Select a more natural-sounding voice if available
            const selectedVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Microsoft David'));

            // Set the selected voice if found
            if (selectedVoice) {
                speech.voice = selectedVoice;
            }

            // Speak the content
            window.speechSynthesis.speak(speech);
        }

        // Add event listener to the button
        button.addEventListener("click", readAloud);

        // Fetch the voices list as it's not always available immediately on some browsers
        window.speechSynthesis.onvoiceschanged = function() {
            const voices = window.speechSynthesis.getVoices();
        };
    } else {
        console.error('Text-to-Speech button not found');
    }
});
