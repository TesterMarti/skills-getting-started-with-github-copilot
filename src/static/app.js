document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear previous select options (leave the placeholder option)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Create participants section using safe DOM methods
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsContainer.appendChild(participantsHeader);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";


          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Create initials from email/name safely
            const initials = String(p)
              .split("@")[0]
              .split(/[\.\-_ ]+/)
              .map(s => s[0] || "")
              .slice(0,2)
              .join("")
              .toUpperCase();
            avatar.textContent = initials || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            // Add delete icon
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Remove participant";
            deleteBtn.innerHTML = "&#128465;"; // Unicode trash can
            deleteBtn.style.marginLeft = "auto";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.color = "#c62828";
            deleteBtn.style.fontSize = "18px";
            deleteBtn.style.padding = "0 8px";

            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                  method: "POST"
                });
                if (response.ok) {
                  li.remove();
                  // Optionally, show a message
                  messageDiv.textContent = `${p} removed from ${name}`;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 3000);
                  // Refresh activities list
                  fetchActivities();
                } else {
                  const result = await response.json();
                  messageDiv.textContent = result.detail || "Failed to remove participant.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 3000);
                }
              } catch (err) {
                messageDiv.textContent = "Network error.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 3000);
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          none.textContent = "No participants yet";
          participantsContainer.appendChild(none);
        }

        activityCard.appendChild(participantsContainer);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
