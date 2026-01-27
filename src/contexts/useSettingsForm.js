import { useState, useEffect, useCallback } from '@wordpress/element';

export default function useSettingsForm( {
	adminData,
	updateAdminData,
	action,
} ) {
	const [ adminOptions, setAdminOptions ] = useState( {} );
	const [ form, setForm ] = useState( {
		rest_firewall_use_rest_models_enabled: false,
		rest_firewall_relative_url_enabled: false,
		rest_firewall_embed_featured_attachment_enabled: false,
		rest_firewall_embed_post_attachments_enabled: false,
		rest_firewall_relative_attachment_url_enabled: false,
		rest_firewall_embed_terms_enabled: false,
		rest_firewall_embed_author_enabled: false,
		rest_firewall_with_acf_enabled: false,
		rest_firewall_json_acf_fields_enabled: false,

		rest_api_posts_per_page: 100,
		rest_api_attachments_per_page: 100,
		rest_api_restrict_post_types_enabled: false,
		rest_api_allowed_post_types: [],

		application_host: '',
		application_webhook_endpoint: '',

		core_redirect_templates_enabled:false,
		core_redirect_templates_preset_url:'',
		core_redirect_templates_free_url_enabled: false,
		core_redirect_templates_free_url: '',
		core_disable_gutenberg_enabled: false,
		core_disable_comments_enabled: false,
		core_remove_empty_p_tags_enabled: false,
		core_max_upload_weight: 1024,
		core_max_upload_weight_enabled: false,
		core_svg_webp_support_enabled: false,
	} );

	useEffect( () => {
		if ( ! adminData?.admin_options ) {
			return;
		}
		setAdminOptions( adminData.admin_options );
	}, [ adminData ] );

	useEffect( () => {
		if ( ! adminOptions ) {
			return;
		}

		setForm( {
			rest_firewall_use_rest_models_enabled: Boolean(
				adminOptions.rest_firewall_use_rest_models_enabled
			),
			rest_firewall_embed_featured_attachment_enabled: Boolean(
				adminOptions.rest_firewall_embed_featured_attachment_enabled
			),
			rest_firewall_embed_author_enabled: Boolean(
				adminOptions.rest_firewall_embed_author_enabled
			),
			rest_firewall_relative_url_enabled: Boolean(
				adminOptions.rest_firewall_relative_url_enabled
			),
			rest_firewall_embed_post_attachments_enabled: Boolean(
				adminOptions.rest_firewall_embed_post_attachments_enabled
			),
			rest_firewall_relative_attachment_url_enabled: Boolean(
				adminOptions.rest_firewall_relative_attachment_url_enabled
			),
			rest_firewall_embed_terms_enabled: Boolean(
				adminOptions.rest_firewall_embed_terms_enabled
			),
			rest_firewall_with_acf_enabled: Boolean(
				adminOptions.rest_firewall_with_acf_enabled
			),
			rest_firewall_json_acf_fields_enabled:Boolean(
				adminOptions.rest_firewall_json_acf_fields_enabled
			), 

			rest_api_allowed_post_types: Array.isArray(
				adminOptions.rest_api_allowed_post_types
			)
				? adminOptions.rest_api_allowed_post_types
				: [],
			rest_api_posts_per_page: Number(
				adminOptions.rest_api_posts_per_page ?? 100
			),
			rest_api_attachments_per_page: Number(
				adminOptions.rest_api_attachments_per_page ?? 100
			),
			rest_api_restrict_post_types_enabled: Boolean(
				adminOptions.rest_api_restrict_post_types_enabled
			),

			application_host: adminOptions.application_host ?? '',
			application_webhook_endpoint: adminOptions.application_webhook_endpoint ?? '',

			core_redirect_templates_enabled: Boolean(
				adminOptions.core_redirect_templates_enabled
			),
			core_redirect_templates_preset_url: adminOptions.core_redirect_templates_preset_url ?? '',
			core_redirect_templates_free_url_enabled: Boolean(
				adminOptions.core_redirect_templates_free_url_enabled
			),
			core_redirect_templates_free_url: adminOptions.core_redirect_templates_free_url ?? '',

			core_disable_gutenberg_enabled: Boolean(
				adminOptions.core_disable_gutenberg_enabled
			),
			core_disable_comments_enabled: Boolean(
				adminOptions.core_disable_comments_enabled
			),
			core_remove_empty_p_tags_enabled: Boolean(
				adminOptions.core_remove_empty_p_tags_enabled
			),
			core_max_upload_weight: Number(
				adminOptions.core_max_upload_weight ?? 1024
			),
			core_max_upload_weight_enabled: Boolean(
				adminOptions.core_max_upload_weight_enabled
			),
			core_svg_webp_support_enabled: Boolean( 
				adminOptions.core_svg_webp_support_enabled
			)
		} );
	}, [ adminOptions ] );

	const setField = useCallback( ( eventOrName, maybeValue ) => {
		if ( eventOrName?.target ) {
			const { name, value, type, checked } = eventOrName.target;
			if ( ! name ) {
				return;
			}

			setForm( ( prev ) => ( {
				...prev,
				[ name ]: type === 'checkbox' ? Boolean( checked ) : value,
			} ) );
			return;
		}

		if ( typeof eventOrName === 'string' ) {
			setForm( ( prev ) => ( {
				...prev,
				[ eventOrName ]: maybeValue,
			} ) );
		}
	}, [] );

	const setSlider = useCallback( ( name, value ) => {
		const numericValue = Array.isArray( value )
			? Number( value[ 0 ] )
			: Number( value );

		setForm( ( prev ) => ( {
			...prev,
			[ name ]: Number.isFinite( numericValue ) ? numericValue : 0,
		} ) );
	}, [] );

	const mapFormToAdminOptions = useCallback(
		( formData ) => ( {
			rest_firewall_use_rest_models_enabled: 
				formData.rest_firewall_use_rest_models_enabled,
			rest_firewall_embed_featured_attachment_enabled:
				formData.rest_firewall_embed_featured_attachment_enabled,
			rest_firewall_relative_url_enabled: 
				formData.rest_firewall_relative_url_enabled,
			rest_firewall_embed_post_attachments_enabled:
				formData.rest_firewall_embed_post_attachments_enabled,
			rest_firewall_relative_attachment_url_enabled:
				formData.rest_firewall_relative_attachment_url_enabled,
			rest_firewall_embed_terms_enabled: 
				formData.rest_firewall_embed_terms_enabled,
			rest_firewall_embed_author_enabled: 
				formData.rest_firewall_embed_author_enabled,
			rest_firewall_with_acf_enabled: 
				formData.rest_firewall_with_acf_enabled,
			rest_firewall_json_acf_fields_enabled: 
				formData.rest_firewall_json_acf_fields_enabled,

			rest_api_allowed_post_types: formData.rest_api_allowed_post_types,
			rest_api_restrict_post_types_enabled:
				formData.rest_api_restrict_post_types_enabled,
			rest_api_posts_per_page: formData.rest_api_posts_per_page,
			rest_api_attachments_per_page: formData.rest_api_attachments_per_page,

			application_host: formData.application_host,
			application_webhook_endpoint: formData.application_webhook_endpoint,

			core_redirect_templates_enabled: 
				formData.core_redirect_templates_enabled,
			core_redirect_templates_preset_url: formData.core_redirect_templates_preset_url,
			core_redirect_templates_free_url_enabled: 
				formData.core_redirect_templates_free_url_enabled,
			core_redirect_templates_free_url: formData.core_redirect_templates_free_url,

			core_svg_webp_support_enabled: formData.core_svg_webp_support_enabled,
			core_max_upload_weight: formData.core_max_upload_weight,
			core_max_upload_weight_enabled: 
				formData.core_max_upload_weight_enabled,

			core_disable_gutenberg_enabled: 
				formData.core_disable_gutenberg_enabled,
			core_disable_comments_enabled: 
				formData.core_disable_comments_enabled,
			core_remove_empty_p_tags_enabled:
				formData.core_remove_empty_p_tags_enabled,
		} ),
		[]
	);

	const submit = useCallback( async () => {
		if ( ! adminData?.nonce || ! adminData?.ajaxurl ) {
			throw new Error( 'Missing AJAX configuration' );
		}

		const response = await fetch( adminData.ajaxurl, {
			method: 'POST',
			headers: {
				'Content-Type':
					'application/x-www-form-urlencoded; charset=UTF-8',
			},
			body: new URLSearchParams( {
				action,
				nonce: adminData.nonce,
				options: JSON.stringify( form ),
			} ),
		} );

		const data = await response.json();

		if ( ! data.success ) {
			throw new Error( data.data?.error || 'Unknown error' );
		}

		updateAdminData( {
			admin_options: {
				...adminOptions,
				...mapFormToAdminOptions( form ),
			},
		} );
	}, [
		adminData,
		form,
		updateAdminData,
		adminOptions,
		mapFormToAdminOptions,
		action,
	] );

	return {
		form,
		setField,
		setSlider,
		submit,
	};
}
