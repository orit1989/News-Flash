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


    function renderNotesList(data) {
      var notesToRender = [];
      var currentNote;
      if (!data.notes.length) {
        currentNote = ["<li class='list-group-item'>", "No notes for this article yet.", "</li>"].join("");
        notesToRender.push(currentNote);
      }
      else {
        for (var i = 0; i < data.notes.length; i++) {
          currentNote = $(
            [
              "<li class='list-group-item note'>",
              data.notes[i].body,
              "<button class='btn btn-danger note-delete'>x</button>",
              "</li>"
            ].join("")
          );
          currentNote.children("button").data("_id", data.notes[i]._id);
          notesToRender.push(currentNote);
        }
      }
      $(".note-container").append(notesToRender);
    }
  
    function handleArticleNotes() {
        var thisId = $(this).attr("data-id");
        $.get("/notes/" + thisId).then(function(data) {
          var modalText = [
            "<div class='container-fluid text-center'>",
            "<hr />",
            "<ul class='list-group note-container'>",
            "</ul>",
            "<textarea id='newNoteArea' placeholder='New Note' rows='4' cols='60'></textarea>",
            "<button class='btn btn-success save'>Save Note</button>",
            "</div>"
          ].join("");
          bootbox.dialog({
            message: modalText,
            closeButton: true
          });
          var noteData = {
            _id: thisId,
            notes: data || []
          };
          $(".btn.save").data("article", noteData);
          renderNotesList(noteData);
        });
      }
    
      function handleNoteSave() {
        var noteData;
        var newNote = {};
        newNote.body = $("#newNoteArea").val().trim();
        if (newNote) {
            thisId = $(this).data("article")._id;
          $.post("/notes/" + thisId, newNote).then(function() {
            bootbox.hideAll();
          });
        }
      }
    
      function handleNoteDelete() {
        var noteToDelete = $(this).data("_id");
        $.ajax({
          url: "/notes/" + noteToDelete,
          method: "DELETE"
        }).then(function() {
          bootbox.hideAll();
        });
      }

});