const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Windows: native library codegen object paths embed the absolute source path
 * and pass the 260-character MAX_PATH under android/app/.cxx. CMake can only
 * shorten them (by hashing) when the build directory itself is short, so the
 * native build is staged in a short temp folder. Re-applied on every
 * `expo prebuild`.
 */
const MARKER = '// lbos: short native build path on Windows (v2)';

const SNIPPET = `
${MARKER}
android {
    if (System.getProperty("os.name").toLowerCase().contains("windows")) {
        externalNativeBuild {
            cmake {
                buildStagingDirectory = new File(System.getenv("TEMP") ?: "C:/tmp", "lbos-cxx")
            }
        }
        // React Native passes CMAKE_OBJECT_PATH_MAX=1024, which turns CMake's
        // hashing of over-long object paths off; bring it back under MAX_PATH.
        defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_OBJECT_PATH_MAX=240"
                }
            }
        }
    }
}
`;

module.exports = function withShortCxxPath(config) {
  return withAppBuildGradle(config, cfg => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += SNIPPET;
    }
    return cfg;
  });
};
