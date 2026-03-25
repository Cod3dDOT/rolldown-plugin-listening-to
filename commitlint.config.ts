/*
 * SPDX-FileCopyrightText: 2025 cod3ddot@proton.me
 *
 * SPDX-License-Identifier: MIT
 */

import { RuleConfigSeverity } from "@commitlint/types";

/*
 * https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional
 */
// biome-ignore lint/style/noDefaultExport: required by commitlint
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"body-max-line-length": [RuleConfigSeverity.Error, "always", 200] as const,
		"header-max-length": [RuleConfigSeverity.Error, "always", 150] as const
	}
};
