/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { RuleConfigSeverity } from "@commitlint/types";

/*
 * https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional
 */
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"header-max-length": [RuleConfigSeverity.Error, "always", 150] as const,
		"body-max-line-length": [
			RuleConfigSeverity.Error,
			"always",
			200,
		] as const,
	},
};
