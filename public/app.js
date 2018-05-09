$(document).ready(function () {

    $(".save").on("click", function () {
        var thisId = $(this).attr("data-id");
        $.post("/articles/saved/" + thisId).then(function (data) {
            location.reload("/articles");
        });
    });


    $(".unsave").on("click", function () {
        var thisId = $(this).attr("data-id");
        $.ajax({
                method: "PUT",
                url: "/articles/saved/" + thisId
            })
            .then(function (data) {
                location.reload("/articles");
            })
    });


    $(".note").on("click", handleArticleNotes);
    $(document).on("click", ".btn.save", handleNoteSave);
    $(document).on("click", ".btn.note-delete", handleNoteDelete);

    function handleArticleNotes() {

        var thisId = $(this).attr("data-id");
        // Grab any notes with this headline/article id
        $.get("/notes/" + thisId).then(function(data) {
          // Constructing our initial HTML to add to the notes modal
          var modalText = [
            "<div class='container-fluid text-center'>",
            "<hr />",
            "<ul class='list-group note-container'>",
            "</ul>",
            "<textarea placeholder='New Note' rows='4' cols='60'></textarea>",
            "<button class='btn btn-success save'>Save Note</button>",
            "</div>"
          ].join("");
          // Adding the formatted HTML to the note modal
          bootbox.dialog({
            message: modalText,
            closeButton: true
          });
          var noteData = {
            _id: thisId,
            notes: data || []
          };
          // Adding some information about the article and article notes to the save button for easy access
          // When trying to add a new note
          $(".btn.save").data("article", noteData);
          // renderNotesList will populate the actual note HTML inside of the modal we just created/opened
          //renderNotesList(noteData);
        });
      }
    
      function handleNoteSave() {
        // This function handles what happens when a user tries to save a new note for an article
        // Setting a variable to hold some formatted data about our note,
        // grabbing the note typed into the input box
        var noteData;
        var newNote = $(".bootbox-body textarea").val().trim();
        // If we actually have data typed into the note input field, format it
        // and post it to the "/api/notes" route and send the formatted noteData as well
        if (newNote) {
            thisId = $(this).data("article")._id;
          $.post("/notes/" + thisId, newNote).then(function() {
            // When complete, close the modal
            bootbox.hideAll();
          });
        }
      }
    
      function handleNoteDelete() {
        // This function handles the deletion of notes
        // First we grab the id of the note we want to delete
        // We stored this data on the delete button when we created it
        var noteToDelete = $(this).data("_id");
        // Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
        $.ajax({
          url: "/api/notes/" + noteToDelete,
          method: "DELETE"
        }).then(function() {
          // When done, hide the modal
          bootbox.hideAll();
        });
      }

});