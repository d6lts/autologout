// $Id:

Drupal.behaviors.autologout = function (context) {
  var paddingTimer;
  var t;
  var theDialog;

  if (context == document) {
    if (Drupal.settings.autologout.refresh_only) {
      // On pages that cannot be logged out of don't start the logout countdown.
      t = setTimeout(keepAlive, Drupal.settings.autologout.timeout);
    }
    else {
      // On pages where the user can be logged out, set the timer to popup
      // and log them out.
      t = setTimeout(init, Drupal.settings.autologout.timeout);
    }
  }

  function init() {
    if (Drupal.settings.autologout.jquery_ui) {
      paddingTimer = setTimeout(confirmLogout, Drupal.settings.autologout.timeout_padding);

      // While the countdown timer is going, lookup the remaining time. If there
      // is more time remaining (i.e. a user is navigating in another tab), then
      // reset the timer for opening the dialog.
      $.ajax({
        url : Drupal.settings.basePath + 'autologout_ajax_get_time_left',
        dataType: 'json',
        success: function(data) {
          if (data.time > 0) {
            clearTimeout(paddingTimer);
            t = setTimeout(init, data.time);
          }
          else {
            theDialog = dialog();
          }
        },
        error: function(XMLHttpRequest, textStatus) {
          if (XMLHttpRequest.status == 403) {
            window.location = Drupal.settings.autologout.redirect_url;
          }
        }
      });
    }
    else {
      if (confirm(Drupal.settings.autologout.message) ) {
        refresh();
      }
      else {
        logout();
      }
    }
  }

  function keepAlive() {
    $.ajax({
      url: Drupal.settings.basePath + "autologout_ahah_set_last",
      type: "POST",
      success: function() {
        // After keeping the connection alive, start the timer again.
        t = setTimeout(keepAlive, Drupal.settings.autologout.timeout);
      },
      error: function(XMLHttpRequest, textStatus) {
        if (XMLHttpRequest.status == 403) {
          window.location = Drupal.settings.autologout.redirect_url;
        }
      }
    });
  }

  function dialog() {
    var buttons = {};
    buttons[Drupal.t('Yes')] = function() {
      $(this).dialog("destroy");
      clearTimeout(paddingTimer);
      refresh();
    };

    buttons[Drupal.t('No')] = function() {
      $(this).dialog("destroy");
      logout();
    };

    return $('<div>' +  Drupal.settings.autologout.message + '</div>').dialog({
      modal: true,
      closeOnEscape: false,
      width: 'auto',
      buttons: buttons,
      title: Drupal.settings.autologout.title,
      close: function(event, ui) {
        logout();
      }
    });
  }

  function refresh() {
    $.ajax({
      url: Drupal.settings.basePath + 'autologout_ahah_set_last',
      type: "POST",
      success: function() {
        t = setTimeout(init, Drupal.settings.autologout.timeout);
      },
      error: function(XMLHttpRequest, textStatus) {
        if (XMLHttpRequest.status == 403) {
          window.location = Drupal.settings.autologout.redirect_url;
        }
      }
    });
  }

  // A user could have used the reset button on the tab/window they're actively
  // using, so we need to double check before actually logging out.
  function confirmLogout() {
    $(theDialog).dialog('destroy');
    $.ajax({
      url : Drupal.settings.basePath + 'autologout_ajax_get_time_left',
      dataType: 'json',
      error: logout,
      success: function(data) {
        if (data.time > 0) {
          t = setTimeout(init, data.time);
        }
        else {
          logout();
        }
      }
    });
  }

  function logout() {
    $.ajax({
      url: Drupal.settings.basePath + 'autologout_ahah_logout',
      type: "POST",
      success: function() {
        document.location.href = Drupal.settings.autologout.redirect_url;
      },
      error: function(XMLHttpRequest, textStatus) {
        if (XMLHttpRequest.status == 403) {
          window.location = Drupal.settings.autologout.redirect_url;
        }
      }
    });
  }
};
