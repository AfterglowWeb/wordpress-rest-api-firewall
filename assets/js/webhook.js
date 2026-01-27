window.restApiFirewallTriggerWebhook = function ( e ) {
	if ( ! confirm( restApiFirewallWebhookService.confirmMessage ) ) {
		return;
	}
	jQuery.post(
		restApiFirewallWebhookService.ajaxurl,
		{
			action: 'trigger_application_webhook',
			nonce: restApiFirewallWebhookService.nonce,
		},
		function ( response ) {
			if ( response.success && response.data ) {
				alert(
					`Success:\n${ response.data.message } at ${ response.data.timestamp }`
				);
			} else {
				alert(
					'Error: ' +
						( response.data && response.data.error
							? response.data.error
							: 'Unknown error' )
				);
			}
		}
	);
};
