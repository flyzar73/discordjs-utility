class advancedSelectMenu {
	/**
	 * Sends an interactive select menu with pagination and optional callback handling.
	 *
	 * @async
	 * @function sendMenu
	 * @param {Array<Object>} options - The options to display in the select menu, each option should be an object with `label`, `value`, and optionally `description` and `emoji`.
	 * @param {Object} interaction - The Discord interaction object used to send or update the message.
	 * @param {Function|null} update_command - A function to update the message, or null to use `interaction.editReply` (Must be async and return the edited message).
	 * @param {number} [page=0] - The current page index for paginated options.
	 * @param {number} [chunkSize=25] - The number of options to display per page.
	 * @param {string} customId - The custom ID to identify the select menu and buttons.
	 * @param {Function} callback - A callback function to handle the selected option. Receives the interaction response as an argument.
	 * @param {string} [content='Select a card: '] - The content of the message to display above the select menu.
	 * @returns {Promise<void>} Resolves when the menu interaction is completed.
	 * @throws {Error} If an error occurs during the interaction handling.
	 * @description
	 * This function creates a paginated select menu with buttons for navigation. It allows users to select an option and handles the interaction accordingly.
	 * The options are displayed in chunks, and users can navigate through them using the "«" and "»" buttons.
	 * The selected option is passed to the callback function for further processing.
	 * The function also handles the case where there are no options to display, and it will send an ephemeral message in that case.
	 * @example
	 * const options = [
	 *   { label: 'Option 1', value: 'option1' },
	 *  { label: 'Option 2', value: 'option2' },
	 *  { label: 'Option 3', value: 'option3' },
	 *  { label: 'Option 4', value: 'option4' },
	 * { label: 'Option 5', value: 'option5' }
	 * ];
	 * const customId = 'my_custom_id';
	 * const callback = (response) => {
	 *  console.log(`Selected option: ${response.values[0]}`);
	 * };
	 * const interaction = await message.reply({ content: 'Select an option:', components: [] });
	 * const advancedSelectMenu = new advancedSelectMenu();
	 * await advancedSelectMenu.sendMenu(options, interaction, async (params) => {await interaction.editReply(params)}, 0, 2, customId, callback);
	 * //This will create a paginated select menu with 2 options per page and a custom ID of 'my_custom_id'.
	 *
	 */
	async sendMenu(options, interaction, update_command, page = 0, chunkSize = 25, customId, callback, content = 'Select a card: ') {
		const chunkedOptions = chunkArray(options, chunkSize);
		const currentOptions = chunkedOptions[page];

		const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(customId).addOptions(currentOptions));
		let rows = [row];

		if (chunkedOptions.length == 0) return interaction.editReply({ content: 'No options to select', flags: MessageFlags.Ephemeral });

		if (chunkedOptions.length > 1) {
			const buttonRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`${customId}--prev`)
					.setLabel('«')
					.setStyle(page == 0 ? ButtonStyle.Danger : ButtonStyle.Primary)
					.setDisabled(page == 0),
				new ButtonBuilder()
					.setCustomId(`${customId}--nothing`)
					.setLabel(`${Number(page) + 1}`)
					.setStyle(ButtonStyle.Success)
					.setDisabled(chunkedOptions.length == 1),
				new ButtonBuilder()
					.setCustomId(`${customId}--next`)
					.setLabel('»')
					.setStyle(page == chunkedOptions.length - 1 ? ButtonStyle.Danger : ButtonStyle.Primary)
					.setDisabled(page == chunkedOptions.length - 1)
			);
			rows.push(buttonRow);
		}

		let message = await (update_command ?? interaction.editReply)({ content, components: rows });

		const response = await message.awaitMessageComponent().catch((err) => require('../../utils/Logger').error(client, err));
		do {
			if (!response.customId) return;
			if (response.customId == `${customId}--prev`) {
				return await sendMenu(
					options,
					interaction,
					async (params) => {
						response.update(params);
						return response.message;
					},
					page - 1,
					chunkSize,
					customId,
					callback,
					content
				);
			} else if (response.customId == `${customId}--nothing`) {
				return await sendMenu(
					options,
					interaction,
					async () => {
						response.reply({ content: `Eh! I have a secret told you!\n\n||There is no point in pressing a button in this range||`, flags: MessageFlags.Ephemeral });
						return response.message;
					},
					page,
					chunkSize,
					customId,
					callback,
					content
				);
			} else if (response.customId == `${customId}--next`) {
				return await sendMenu(
					options,
					interaction,
					async (params) => {
						response.update(params);
						return response.message;
					},
					page + 1,
					chunkSize,
					customId,
					callback,
					content
				);
			} else if (response.customId == customId) {
				callback(response);
				return response;
			}
		} while (true);
	}

	chunkArray(array, chunkSize = 25) {
		const chunks = [];
		for (let i = 0; i < array.length; i += chunkSize) {
			chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
	}
}
module.exports = advancedSelectMenu;
